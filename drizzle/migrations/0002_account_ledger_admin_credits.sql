create table public.account_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount_usd numeric(20,2) not null check (amount_usd > 0 and amount_usd <= 1000000000),
  entry_type text not null default 'deposit' check (entry_type in ('deposit')),
  memo text check (memo is null or char_length(memo) <= 200),
  funding_source text not null default 'system' check (funding_source in ('system')),
  created_by uuid,
  created_at timestamptz not null default now()
);
create index account_ledger_user_idx on public.account_ledger(user_id, created_at desc);
grant select on public.account_ledger to authenticated;
grant all on public.account_ledger to service_role;
alter table public.account_ledger enable row level security;
create policy "Own ledger or admin" on public.account_ledger for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create trigger trg_ledger_immutable before update or delete on public.account_ledger
  for each row execute function public.forbid_mutation();

create or replace function public.admin_credit_account(_target uuid, _amount numeric, _memo text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; clean_memo text := nullif(trim(coalesce(_memo,'')), '');
begin
  perform public.require_admin_level(array['super_admin','ops_admin']::public.app_role[]);
  if _amount is null or _amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if _amount > 1000000000 then raise exception 'Amount is above the 1,000,000,000 limit per deposit'; end if;
  if _amount <> round(_amount, 2) then raise exception 'Amount can have at most 2 decimal places'; end if;
  if not exists (select 1 from public.profiles where id = _target) then raise exception 'Account not found'; end if;
  if clean_memo is not null and char_length(clean_memo) > 200 then raise exception 'Note must be 200 characters or fewer'; end if;
  insert into public.account_ledger(user_id, amount_usd, memo, created_by)
    values (_target, _amount, clean_memo, auth.uid()) returning id into new_id;
  insert into public.audit_logs(actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'account.credit', 'user', _target::text,
      jsonb_build_object('ledger_id', new_id, 'amount_usd', _amount, 'memo', clean_memo, 'self', _target = auth.uid()));
  insert into public.notifications(user_id, kind, title, body, link)
    values (_target, 'account', 'Deposit received', '$' || to_char(_amount, 'FM999,999,999,990.00') || ' was added to your account.', '/dashboard/transactions');
  return new_id;
end $$;
revoke all on function public.admin_credit_account(uuid, numeric, text) from public, anon;
grant execute on function public.admin_credit_account(uuid, numeric, text) to authenticated;

create or replace function public.my_account_balance()
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount_usd), 0) from public.account_ledger where user_id = auth.uid()
$$;
revoke all on function public.my_account_balance() from public, anon;
grant execute on function public.my_account_balance() to authenticated;