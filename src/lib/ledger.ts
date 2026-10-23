import Decimal from "decimal.js";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Mirrors the database rule: more than 0, at most 1,000,000,000, up to 2 decimals. */
export const MAX_CREDIT_USD = 1_000_000_000;

export function parseCreditAmount(input: string): string | null {
  const v = input.trim().replace(/[,$\s]/g, "");
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(v)) return null;
  const d = new Decimal(v);
  if (d.lte(0) || d.gt(MAX_CREDIT_USD)) return null;
  return d.toFixed(2);
}

export const balanceQuery = (userId: string) =>
  queryOptions({
    queryKey: ["ledger", "balance", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_account_balance");
      if (error) throw error;
      return String(data ?? 0);
    },
  });

export const myLedgerQuery = (userId: string) =>
  queryOptions({
    queryKey: ["ledger", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_ledger")
        .select("id, amount_usd, entry_type, memo, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
