ALTER TABLE public.account_ledger DROP CONSTRAINT account_ledger_amount_usd_check;
ALTER TABLE public.account_ledger ADD CONSTRAINT account_ledger_amount_usd_check CHECK (amount_usd <> 0 AND abs(amount_usd) <= 1000000000);
ALTER TABLE public.account_ledger DROP CONSTRAINT account_ledger_entry_type_check;
ALTER TABLE public.account_ledger ADD CONSTRAINT account_ledger_entry_type_check CHECK (entry_type IN ('deposit','debit'));
ALTER TABLE public.account_ledger ADD CONSTRAINT account_ledger_sign_check CHECK ((entry_type = 'deposit' AND amount_usd > 0) OR (entry_type = 'debit' AND amount_usd < 0));

CREATE OR REPLACE FUNCTION public.admin_debit_account(_target uuid, _amount numeric, _memo text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare new_id uuid; clean_memo text := nullif(trim(coalesce(_memo,'')), ''); bal numeric;
begin
  perform public.require_admin_level(array['super_admin','ops_admin']::public.app_role[]);
  if _amount is null or _amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if _amount > 1000000000 then raise exception 'Amount is above the 1,000,000,000 limit'; end if;
  if _amount <> round(_amount, 2) then raise exception 'Amount can have at most 2 decimal places'; end if;
  if not exists (select 1 from public.profiles where id = _target) then raise exception 'Account not found'; end if;
  if clean_memo is not null and char_length(clean_memo) > 200 then raise exception 'Note must be 200 characters or fewer'; end if;
  perform pg_advisory_xact_lock(hashtext(_target::text));
  select coalesce(sum(amount_usd),0) into bal from public.account_ledger where user_id = _target;
  if bal < _amount then raise exception 'Insufficient balance (available %)', to_char(bal, 'FM999,999,999,990.00'); end if;
  insert into public.account_ledger(user_id, amount_usd, entry_type, memo, created_by)
    values (_target, -_amount, 'debit', clean_memo, auth.uid()) returning id into new_id;
  insert into public.audit_logs(actor_id, action, target_type, target_id, details)
    values (auth.uid(), 'account.debit', 'user', _target::text,
      jsonb_build_object('ledger_id', new_id, 'amount_usd', _amount, 'memo', clean_memo, 'self', _target = auth.uid()));
  insert into public.notifications(user_id, kind, title, body, link)
    values (_target, 'account', 'Debit applied', '$' || to_char(_amount, 'FM999,999,999,990.00') || ' was debited from your account.', '/dashboard/transactions');
  return new_id;
end $$;
REVOKE ALL ON FUNCTION public.admin_debit_account(uuid, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_debit_account(uuid, numeric, text) TO authenticated;