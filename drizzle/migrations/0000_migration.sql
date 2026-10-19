
-- ============ ENUMS ============
create type public.app_role as enum ('super_admin','ops_admin','support_agent','user');
create type public.account_status as enum ('active','suspended');
create type public.position_source as enum ('user_reported','demo');
create type public.ticket_status as enum ('open','pending','resolved','closed');
create type public.ticket_category as enum ('account','portfolio','market_data','security','other');

-- ============ updated_at helper ============
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Investor' check (char_length(display_name) between 1 and 60),
  status public.account_status not null default 'active',
  suspended_reason text check (suspended_reason is null or char_length(suspended_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- ============ ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index on public.user_roles(user_id);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('super_admin','ops_admin'))
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('super_admin','ops_admin','support_agent'))
$$;
create or replace function public.is_active_user(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and status = 'active')
$$;

create policy "Users read own roles; admins read all" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- profiles policies
create policy "Read own profile or staff" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "Update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- prevent users from changing their own status via column check trigger
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.status is distinct from old.status or new.suspended_reason is distinct from old.suspended_reason)
     and coalesce(current_setting('app.admin_action', true),'') <> 'on' then
    raise exception 'Account status can only be changed by an administrator';
  end if;
  return new;
end $$;
create trigger trg_profiles_guard before update on public.profiles for each row execute function public.guard_profile_update();

-- ============ PREFERENCES ============
create table public.user_preferences (
  user_id uuid primary key,
  email_notifications boolean not null default true,
  inapp_notifications boolean not null default true,
  security_alerts boolean not null default true,
  demo_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.user_preferences to authenticated;
grant all on public.user_preferences to service_role;
alter table public.user_preferences enable row level security;
create policy "Own prefs select" on public.user_preferences for select to authenticated using (user_id = auth.uid());
create policy "Own prefs insert" on public.user_preferences for insert to authenticated with check (user_id = auth.uid());
create policy "Own prefs update" on public.user_preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_prefs_updated before update on public.user_preferences for each row execute function public.set_updated_at();

-- ============ ASSETS ============
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique check (symbol ~ '^[A-Z0-9]{2,10}$'),
  name text not null,
  provider_id text not null,
  decimals int not null default 6 check (decimals between 0 and 18),
  created_at timestamptz not null default now()
);
grant select on public.assets to anon, authenticated;
grant all on public.assets to service_role;
alter table public.assets enable row level security;
create policy "Assets are public" on public.assets for select to anon, authenticated using (true);
insert into public.assets(symbol, name, provider_id, decimals) values ('XRP','XRP','ripple',6);

-- ============ MARKET SNAPSHOTS ============
create table public.market_price_snapshots (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  price_usd numeric(24,8) not null check (price_usd > 0),
  change_24h_pct numeric(12,4),
  high_24h numeric(24,8),
  low_24h numeric(24,8),
  volume_24h numeric(30,2),
  market_cap numeric(30,2),
  source text not null,
  provider_updated_at timestamptz,
  fetched_at timestamptz not null default now()
);
create index on public.market_price_snapshots(asset_id, fetched_at desc);
grant select on public.market_price_snapshots to anon, authenticated;
grant all on public.market_price_snapshots to service_role;
alter table public.market_price_snapshots enable row level security;
create policy "Market snapshots are public" on public.market_price_snapshots for select to anon, authenticated using (true);

-- ============ PORTFOLIO ============
create table public.portfolio_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  asset_id uuid not null references public.assets(id),
  quantity numeric(38,8) not null check (quantity > 0 and quantity < 1e15),
  cost_basis_usd numeric(24,2) check (cost_basis_usd is null or cost_basis_usd >= 0),
  acquired_on date,
  source public.position_source not null default 'user_reported',
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.portfolio_positions(user_id);
grant select, insert, update, delete on public.portfolio_positions to authenticated;
grant all on public.portfolio_positions to service_role;
alter table public.portfolio_positions enable row level security;
create policy "Own positions select" on public.portfolio_positions for select to authenticated using (user_id = auth.uid());
create policy "Own positions insert" on public.portfolio_positions for insert to authenticated
  with check (user_id = auth.uid() and public.is_active_user(auth.uid()));
create policy "Own positions update" on public.portfolio_positions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_active_user(auth.uid()));
create policy "Own positions delete" on public.portfolio_positions for delete to authenticated using (user_id = auth.uid());
create trigger trg_pos_updated before update on public.portfolio_positions for each row execute function public.set_updated_at();

-- append-only tracking history
create table public.tracked_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  asset_id uuid not null references public.assets(id),
  position_id uuid,
  action text not null check (action in ('added','updated','removed')),
  quantity numeric(38,8) not null,
  previous_quantity numeric(38,8),
  cost_basis_usd numeric(24,2),
  source public.position_source not null,
  occurred_at timestamptz not null default now()
);
create index on public.tracked_transactions(user_id, occurred_at desc);
grant select on public.tracked_transactions to authenticated;
grant all on public.tracked_transactions to service_role;
alter table public.tracked_transactions enable row level security;
create policy "Own history select" on public.tracked_transactions for select to authenticated using (user_id = auth.uid());

create or replace function public.log_position_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.tracked_transactions(user_id, asset_id, position_id, action, quantity, cost_basis_usd, source)
    values (new.user_id, new.asset_id, new.id, 'added', new.quantity, new.cost_basis_usd, new.source);
    return new;
  elsif tg_op = 'UPDATE' then
    if new.user_id <> old.user_id or new.source <> old.source then raise exception 'Immutable fields'; end if;
    insert into public.tracked_transactions(user_id, asset_id, position_id, action, quantity, previous_quantity, cost_basis_usd, source)
    values (new.user_id, new.asset_id, new.id, 'updated', new.quantity, old.quantity, new.cost_basis_usd, new.source);
    return new;
  else
    insert into public.tracked_transactions(user_id, asset_id, position_id, action, quantity, previous_quantity, cost_basis_usd, source)
    values (old.user_id, old.asset_id, old.id, 'removed', 0, old.quantity, old.cost_basis_usd, old.source);
    return old;
  end if;
end $$;
create trigger trg_pos_log after insert or update or delete on public.portfolio_positions for each row execute function public.log_position_change();

create or replace function public.forbid_mutation() returns trigger
language plpgsql as $$ begin raise exception 'This record is append-only'; end $$;
create trigger trg_tx_immutable before update or delete on public.tracked_transactions for each row execute function public.forbid_mutation();

create table public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  total_quantity numeric(38,8) not null,
  price_usd numeric(24,8) not null,
  value_usd numeric(30,2) not null,
  price_source text not null,
  taken_at timestamptz not null default now()
);
create index on public.portfolio_snapshots(user_id, taken_at desc);
grant select, insert on public.portfolio_snapshots to authenticated;
grant all on public.portfolio_snapshots to service_role;
alter table public.portfolio_snapshots enable row level security;
create policy "Own snapshots select" on public.portfolio_snapshots for select to authenticated using (user_id = auth.uid());
-- snapshots are created server-side only (price must not be client supplied)

-- ============ WATCHLIST ============
create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  asset_id uuid not null references public.assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, asset_id)
);
grant select, insert, delete on public.watchlists to authenticated;
grant all on public.watchlists to service_role;
alter table public.watchlists enable row level security;
create policy "Own watchlist select" on public.watchlists for select to authenticated using (user_id = auth.uid());
create policy "Own watchlist insert" on public.watchlists for insert to authenticated with check (user_id = auth.uid());
create policy "Own watchlist delete" on public.watchlists for delete to authenticated using (user_id = auth.uid());

-- ============ LEADERBOARD ============
create table public.leaderboard_preferences (
  user_id uuid primary key,
  opted_in boolean not null default false,
  pseudonym text check (pseudonym is null or pseudonym ~ '^[A-Za-z0-9_\- ]{3,30}$'),
  show_value boolean not null default false,
  updated_at timestamptz not null default now()
);
create unique index leaderboard_pseudonym_unique on public.leaderboard_preferences(lower(pseudonym)) where pseudonym is not null;
grant select, insert, update on public.leaderboard_preferences to authenticated;
grant all on public.leaderboard_preferences to service_role;
alter table public.leaderboard_preferences enable row level security;
create policy "Own lb select" on public.leaderboard_preferences for select to authenticated using (user_id = auth.uid());
create policy "Own lb insert" on public.leaderboard_preferences for insert to authenticated with check (user_id = auth.uid());
create policy "Own lb update" on public.leaderboard_preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_lb_updated before update on public.leaderboard_preferences for each row execute function public.set_updated_at();

-- public leaderboard: only opted-in pseudonyms, user-reported XRP quantity, never ids/emails
create or replace function public.get_leaderboard()
returns table(rank bigint, pseudonym text, tracked_xrp numeric, shows_value boolean, member_since date)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by sum(p.quantity) desc) as rank,
         lp.pseudonym,
         case when lp.show_value then sum(p.quantity) else null end,
         lp.show_value,
         min(pr.created_at)::date
  from public.leaderboard_preferences lp
  join public.profiles pr on pr.id = lp.user_id and pr.status = 'active'
  join public.portfolio_positions p on p.user_id = lp.user_id and p.source = 'user_reported'
  where lp.opted_in and lp.pseudonym is not null
  group by lp.user_id, lp.pseudonym, lp.show_value
  order by sum(p.quantity) desc
  limit 100
$$;
grant execute on function public.get_leaderboard() to anon, authenticated;

-- ============ SUPPORT ============
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subject text not null check (char_length(subject) between 3 and 140),
  category public.ticket_category not null default 'other',
  status public.ticket_status not null default 'open',
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.support_tickets(user_id);
create index on public.support_tickets(status);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null unique references public.support_tickets(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('customer','agent')),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index on public.conversation_participants(user_id);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  body text not null check (char_length(body) between 1 and 4000),
  attachment_path text check (attachment_path is null or attachment_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|jpeg|pdf)$'),
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.messages(conversation_id, created_at);

grant select, insert on public.support_tickets to authenticated;
grant select on public.conversations, public.conversation_participants to authenticated;
grant update (last_read_at) on public.conversation_participants to authenticated;
grant select, insert on public.messages to authenticated;
grant all on public.support_tickets, public.conversations, public.conversation_participants, public.messages to service_role;
alter table public.support_tickets enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_participant(_conv uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.conversation_participants where conversation_id = _conv and user_id = _user)
$$;
create or replace function public.can_view_conversation(_conv uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_participant(_conv, _user) or public.is_admin(_user)
$$;

create policy "Tickets: owner, assigned agent, admins" on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or assigned_to = auth.uid() or public.is_admin(auth.uid()));
create policy "Conversations visible" on public.conversations for select to authenticated
  using (public.can_view_conversation(id, auth.uid()));
create policy "Participants visible" on public.conversation_participants for select to authenticated
  using (public.can_view_conversation(conversation_id, auth.uid()));
create policy "Update own read marker" on public.conversation_participants for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Messages visible" on public.messages for select to authenticated
  using (public.can_view_conversation(conversation_id, auth.uid()));
create policy "Participants can post" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_participant(conversation_id, auth.uid()) and public.is_active_user(auth.uid()));

-- message trigger: rate limit, staff flag, bump, notify
create or replace function public.on_message_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare recent int; t record; p record;
begin
  select count(*) into recent from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 minute';
  if recent >= 15 then raise exception 'Rate limit: too many messages, please wait a minute'; end if;
  new.is_staff := public.is_staff(new.sender_id) and exists(select 1 from public.conversation_participants where conversation_id=new.conversation_id and user_id=new.sender_id and role='agent');
  update public.conversations set last_message_at = now() where id = new.conversation_id;
  update public.conversation_participants set last_read_at = now() where conversation_id = new.conversation_id and user_id = new.sender_id;
  select st.* into t from public.support_tickets st join public.conversations c on c.ticket_id = st.id where c.id = new.conversation_id;
  for p in select user_id from public.conversation_participants where conversation_id = new.conversation_id and user_id <> new.sender_id loop
    insert into public.notifications(user_id, kind, title, body, link)
    values (p.user_id, 'support', 'New reply: ' || left(t.subject, 80), left(new.body, 140), '/dashboard/support');
  end loop;
  if new.is_staff and t.status = 'open' then update public.support_tickets set status='pending' where id = t.id; end if;
  return new;
end $$;

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('support','security','system','portfolio')),
  title text not null check (char_length(title) <= 160),
  body text check (body is null or char_length(body) <= 500),
  link text check (link is null or link ~ '^/[A-Za-z0-9/_\-]*$'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id, created_at desc);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Own notifications select" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own notifications delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

create trigger trg_msg_insert before insert on public.messages for each row execute function public.on_message_insert();
create trigger trg_msg_immutable before update or delete on public.messages for each row execute function public.forbid_mutation();
create trigger trg_tickets_updated before update on public.support_tickets for each row execute function public.set_updated_at();

-- create ticket via RPC (atomic + rate limited)
create or replace function public.create_support_ticket(_subject text, _category public.ticket_category, _body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); tid uuid; cid uuid; recent int;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_active_user(uid) then raise exception 'Account suspended'; end if;
  select count(*) into recent from public.support_tickets where user_id = uid and created_at > now() - interval '1 hour';
  if recent >= 5 then raise exception 'Rate limit: you can open up to 5 tickets per hour'; end if;
  insert into public.support_tickets(user_id, subject, category) values (uid, trim(_subject), _category) returning id into tid;
  insert into public.conversations(ticket_id) values (tid) returning id into cid;
  insert into public.conversation_participants(conversation_id, user_id, role) values (cid, uid, 'customer');
  insert into public.messages(conversation_id, sender_id, body) values (cid, uid, _body);
  return tid;
end $$;
grant execute on function public.create_support_ticket(text, public.ticket_category, text) to authenticated;

-- ============ AUDIT + SECURITY ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs(created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Admins read audit" on public.audit_logs for select to authenticated using (public.is_admin(auth.uid()));
create trigger trg_audit_immutable before update or delete on public.audit_logs for each row execute function public.forbid_mutation();

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  event_type text not null check (event_type in ('sign_in','sign_out','password_changed','password_reset_requested','mfa_enrolled','mfa_removed','account_suspended','account_reactivated','role_changed','admin_access_denied')),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.security_events(user_id, created_at desc);
grant select on public.security_events to authenticated;
grant all on public.security_events to service_role;
alter table public.security_events enable row level security;
create policy "Own or admin security events" on public.security_events for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create trigger trg_sec_immutable before update or delete on public.security_events for each row execute function public.forbid_mutation();

create or replace function public.log_security_event(_event text, _user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  if _event not in ('sign_in','sign_out','password_changed','mfa_enrolled','mfa_removed') then raise exception 'Invalid event'; end if;
  if (select count(*) from public.security_events where user_id = auth.uid() and created_at > now() - interval '1 minute') >= 10 then return; end if;
  insert into public.security_events(user_id, event_type, user_agent) values (auth.uid(), _event, left(_user_agent, 300));
  if _event in ('password_changed','mfa_enrolled','mfa_removed') then
    insert into public.notifications(user_id, kind, title, body, link)
    values (auth.uid(), 'security', 'Security change on your account', 'Event: ' || replace(_event,'_',' ') || '. If this was not you, reset your password.', '/dashboard/security');
  end if;
end $$;
grant execute on function public.log_security_event(text, text) to authenticated;

-- ============ SETTINGS ============
create table public.platform_settings (
  key text primary key check (key ~ '^[a-z_]{3,50}$'),
  value jsonb not null,
  is_public boolean not null default false,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
grant select on public.platform_settings to anon, authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "Public settings readable" on public.platform_settings for select to anon, authenticated using (is_public or public.is_admin(auth.uid()));
insert into public.platform_settings(key, value, is_public) values
  ('maintenance_banner', '""'::jsonb, true),
  ('support_hours', '"Mon–Fri, 9am–6pm ET"'::jsonb, true),
  ('require_admin_mfa', 'true'::jsonb, false),
  ('allow_signups', 'true'::jsonb, true);

-- MFA check for privileged actions
create or replace function public.admin_mfa_ok()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select (value)::text = 'false' from public.platform_settings where key='require_admin_mfa'), false)
      or coalesce(auth.jwt()->>'aal','') = 'aal2'
$$;

-- ============ ADMIN RPCs (server-enforced + audited) ============
create or replace function public.require_admin_level(_roles public.app_role[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists(select 1 from public.user_roles where user_id = auth.uid() and role = any(_roles)) then
    insert into public.security_events(user_id, event_type, details) values (auth.uid(), 'admin_access_denied', jsonb_build_object('required', _roles));
    raise exception 'Forbidden';
  end if;
  if not public.admin_mfa_ok() then raise exception 'MFA required: verify with your authenticator app first'; end if;
end $$;

create or replace function public.admin_metrics()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin_level(array['super_admin','ops_admin','support_agent']::public.app_role[]);
  return jsonb_build_object(
    'accounts', (select count(*) from public.profiles),
    'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'suspended', (select count(*) from public.profiles where status='suspended'),
    'open_tickets', (select count(*) from public.support_tickets where status in ('open','pending')),
    'last_market_fetch', (select max(fetched_at) from public.market_price_snapshots),
    'security_events_24h', (select count(*) from public.security_events where created_at > now() - interval '24 hours')
  );
end $$;

create or replace function public.admin_list_users(_search text default null, _limit int default 25, _offset int default 0)
returns table(id uuid, email text, display_name text, status public.account_status, created_at timestamptz, last_sign_in_at timestamptz, roles public.app_role[], total bigint)
language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.require_admin_level(array['super_admin','ops_admin']::public.app_role[]);
  return query
    select p.id, u.email::text, p.display_name, p.status, p.created_at, u.last_sign_in_at,
      coalesce((select array_agg(r.role) from public.user_roles r where r.user_id = p.id), '{}'),
      count(*) over()
    from public.profiles p join auth.users u on u.id = p.id
    where _search is null or _search = '' or u.email ilike '%' || _search || '%' or p.display_name ilike '%' || _search || '%'
    order by p.created_at desc
    limit least(greatest(_limit,1),100) offset greatest(_offset,0);
end $$;

create or replace function public.admin_set_user_status(_target uuid, _status public.account_status, _reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin_level(array['super_admin','ops_admin']::public.app_role[]);
  if _target = auth.uid() then raise exception 'You cannot change your own status'; end if;
  if public.has_role(_target,'super_admin') and not public.has_role(auth.uid(),'super_admin') then raise exception 'Only a super admin can suspend a super admin'; end if;
  if _reason is null or char_length(trim(_reason)) < 5 then raise exception 'A reason (5+ characters) is required'; end if;
  perform set_config('app.admin_action','on', true);
  update public.profiles set status = _status, suspended_reason = case when _status='suspended' then left(_reason,500) else null end where id = _target;
  insert into public.audit_logs(actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'user.status.' || _status, 'user', _target::text, jsonb_build_object('reason', left(_reason,500)));
  insert into public.security_events(user_id, event_type, details)
    values (_target, case when _status='suspended' then 'account_suspended' else 'account_reactivated' end, jsonb_build_object('by', auth.uid()));
end $$;

create or replace function public.admin_set_role(_target uuid, _role public.app_role, _grant boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin_level(array['super_admin']::public.app_role[]);
  if _target = auth.uid() then raise exception 'You cannot change your own roles'; end if;
  if _role = 'user' then raise exception 'The standard user role is implicit'; end if;
  if _grant then
    insert into public.user_roles(user_id, role) values (_target, _role) on conflict do nothing;
  else
    delete from public.user_roles where user_id = _target and role = _role;
  end if;
  insert into public.audit_logs(actor_id, action, target_type, target_id, details)
    values (auth.uid(), case when _grant then 'role.granted' else 'role.revoked' end, 'user', _target::text, jsonb_build_object('role', _role));
  insert into public.security_events(user_id, event_type, details) values (_target, 'role_changed', jsonb_build_object('role', _role, 'granted', _grant));
end $$;

create or replace function public.admin_list_tickets(_status public.ticket_status default null)
returns table(id uuid, subject text, category public.ticket_category, status public.ticket_status, assigned_to uuid, created_at timestamptz, updated_at timestamptz, conversation_id uuid, customer_name text, last_message_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare admin boolean := public.is_admin(auth.uid());
begin
  perform public.require_admin_level(array['super_admin','ops_admin','support_agent']::public.app_role[]);
  return query
    select t.id, t.subject, t.category, t.status, t.assigned_to, t.created_at, t.updated_at, c.id, p.display_name, c.last_message_at
    from public.support_tickets t join public.conversations c on c.ticket_id = t.id
    join public.profiles p on p.id = t.user_id
    where (admin or t.assigned_to = auth.uid() or t.assigned_to is null)
      and (_status is null or t.status = _status)
    order by c.last_message_at desc limit 200;
end $$;

-- claim/assign: agents may claim unassigned; admins may assign anyone with staff role
create or replace function public.admin_assign_ticket(_ticket uuid, _agent uuid)
returns void language plpgsql security definer set search_path = public as $$
declare cid uuid; cur uuid;
begin
  perform public.require_admin_level(array['super_admin','ops_admin','support_agent']::public.app_role[]);
  if not public.is_staff(_agent) then raise exception 'Assignee must be support staff'; end if;
  select assigned_to into cur from public.support_tickets where id = _ticket;
  if not public.is_admin(auth.uid()) and (_agent <> auth.uid() or cur is not null) then raise exception 'Agents can only claim unassigned tickets'; end if;
  select id into cid from public.conversations where ticket_id = _ticket;
  if cur is not null then delete from public.conversation_participants where conversation_id = cid and user_id = cur and role = 'agent'; end if;
  update public.support_tickets set assigned_to = _agent where id = _ticket;
  insert into public.conversation_participants(conversation_id, user_id, role) values (cid, _agent, 'agent') on conflict do nothing;
  insert into public.audit_logs(actor_id, action, target_type, target_id, details) values (auth.uid(), 'ticket.assigned', 'ticket', _ticket::text, jsonb_build_object('agent', _agent, 'previous', cur));
end $$;

create or replace function public.admin_set_ticket_status(_ticket uuid, _status public.ticket_status)
returns void language plpgsql security definer set search_path = public as $$
declare t record;
begin
  perform public.require_admin_level(array['super_admin','ops_admin','support_agent']::public.app_role[]);
  select * into t from public.support_tickets where id = _ticket;
  if not public.is_admin(auth.uid()) and t.assigned_to is distinct from auth.uid() then raise exception 'Not assigned to you'; end if;
  update public.support_tickets set status = _status where id = _ticket;
  insert into public.notifications(user_id, kind, title, body, link) values (t.user_id, 'support', 'Ticket status: ' || _status, left(t.subject,140), '/dashboard/support');
  insert into public.audit_logs(actor_id, action, target_type, target_id, details) values (auth.uid(), 'ticket.status', 'ticket', _ticket::text, jsonb_build_object('from', t.status, 'to', _status));
end $$;

create or replace function public.admin_list_staff()
returns table(id uuid, display_name text, roles public.app_role[])
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin_level(array['super_admin','ops_admin','support_agent']::public.app_role[]);
  return query select p.id, p.display_name, array_agg(r.role) from public.profiles p join public.user_roles r on r.user_id = p.id
    where r.role in ('super_admin','ops_admin','support_agent') group by p.id, p.display_name;
end $$;

create or replace function public.admin_update_setting(_key text, _value jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare old jsonb;
begin
  perform public.require_admin_level(array['super_admin']::public.app_role[]);
  select value into old from public.platform_settings where key = _key;
  if not found then raise exception 'Unknown setting'; end if;
  update public.platform_settings set value = _value, updated_by = auth.uid(), updated_at = now() where key = _key;
  insert into public.audit_logs(actor_id, action, target_type, target_id, details) values (auth.uid(), 'setting.updated', 'setting', _key, jsonb_build_object('from', old, 'to', _value));
end $$;

revoke execute on function public.admin_metrics(), public.admin_list_users(text,int,int), public.admin_set_user_status(uuid,public.account_status,text),
  public.admin_set_role(uuid,public.app_role,boolean), public.admin_list_tickets(public.ticket_status), public.admin_assign_ticket(uuid,uuid),
  public.admin_set_ticket_status(uuid,public.ticket_status), public.admin_list_staff(), public.admin_update_setting(text,jsonb) from public, anon;
grant execute on function public.admin_metrics(), public.admin_list_users(text,int,int), public.admin_set_user_status(uuid,public.account_status,text),
  public.admin_set_role(uuid,public.app_role,boolean), public.admin_list_tickets(public.ticket_status), public.admin_assign_ticket(uuid,uuid),
  public.admin_set_ticket_status(uuid,public.ticket_status), public.admin_list_staff(), public.admin_update_setting(text,jsonb) to authenticated;

-- ============ SIGNUP TRIGGER ============
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  nm := left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''), nullif(trim(new.raw_user_meta_data->>'full_name'),''), split_part(new.email,'@',1), 'Investor'), 60);
  insert into public.profiles(id, display_name) values (new.id, nm);
  insert into public.user_roles(user_id, role) values (new.id, 'user');
  insert into public.user_preferences(user_id) values (new.id);
  insert into public.leaderboard_preferences(user_id) values (new.id);
  -- bootstrap: the very first account becomes super admin
  if (select count(*) from public.user_roles where role = 'super_admin') = 0 then
    insert into public.user_roles(user_id, role) values (new.id, 'super_admin');
    insert into public.audit_logs(actor_id, action, target_type, target_id, details) values (null, 'role.bootstrap_super_admin', 'user', new.id::text, '{}');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
