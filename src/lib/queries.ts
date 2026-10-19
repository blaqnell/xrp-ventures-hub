import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const positionsQuery = () =>
  queryOptions({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_positions")
        .select("id, quantity, cost_basis_usd, acquired_on, source, note, created_at, updated_at, assets(symbol)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const xrpAssetQuery = () =>
  queryOptions({
    queryKey: ["asset", "XRP"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from("assets").select("id, symbol").eq("symbol", "XRP").single();
      if (error) throw error;
      return data;
    },
  });

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      return data;
    },
  });

export const unreadCountQuery = (userId: string) =>
  queryOptions({
    queryKey: ["notifications", "unread", userId],
    queryFn: async () => {
      const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

export async function signOutEverywhere(queryClient: QueryClient) {
  await supabase.rpc("log_security_event", { _event: "sign_out", _user_agent: navigator.userAgent });
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
}

export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const esc = (v: string | number | null) => {
    let s = v === null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // CSV formula injection guard
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
