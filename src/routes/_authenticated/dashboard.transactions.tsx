import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { PageTitle, EmptyState } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/queries";
import { formatUsd, formatXrp } from "@/lib/finance";
import { useAuth } from "@/hooks/use-auth";
import { balanceQuery, myLedgerQuery } from "@/lib/ledger";

export const Route = createFileRoute("/_authenticated/dashboard/transactions")({
  head: () => ({ meta: [{ title: "Transactions | XRP Ventures" }] }),
  component: Transactions,
});

const PAGE = 25;

function Transactions() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const q = useQuery({
    queryKey: ["history", from, to, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let r = supabase.from("tracked_transactions").select("*", { count: "exact" }).order("occurred_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (from) r = r.gte("occurred_at", new Date(from).toISOString());
      if (to) r = r.lt("occurred_at", new Date(new Date(to).getTime() + 86400000).toISOString());
      const { data, error, count } = await r;
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });
  const { user } = useAuth();
  const balance = useQuery({ ...balanceQuery(user?.id ?? ""), enabled: !!user });
  const deposits = useQuery({ ...myLedgerQuery(user?.id ?? ""), enabled: !!user });
  const rows = q.data?.rows ?? [];
  const pages = Math.max(1, Math.ceil((q.data?.count ?? 0) / PAGE));
  return (
    <>
      <PageTitle title="Tracking history" description="An append-only record of every change to your tracked holdings. These are records you entered, not executed trades." action={rows.length > 0 && <Button variant="outline" size="sm" onClick={() => downloadCsv("xrp-ventures-history.csv", [["occurred_at", "action", "quantity", "previous_quantity", "cost_basis_usd", "source"], ...rows.map((r) => [r.occurred_at, r.action, String(r.quantity), r.previous_quantity === null ? null : String(r.previous_quantity), r.cost_basis_usd === null ? null : String(r.cost_basis_usd), r.source])])}><Download className="h-4 w-4" /> Export page</Button>} />
      <section className="mb-8 rounded-2xl border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-sm font-medium">Deposits</h2>
          <span className="text-sm">Balance <span className="tabular font-semibold">{balance.data === undefined ? "—" : formatUsd(balance.data)}</span></span>
        </div>
        {deposits.data?.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No deposits yet.</p>
        ) : (
          <ul className="divide-y">
            {deposits.data?.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 truncate">Deposit{d.memo && <span className="text-muted-foreground"> · {d.memo}</span>}<span className="block text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("en-US")}</span></span>
                <span className="tabular shrink-0 font-medium text-success">+{formatUsd(d.amount_usd)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <h2 className="mb-3 text-sm font-medium">Holdings history</h2>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div><Label htmlFor="from">From</Label><Input id="from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} className="mt-1.5" /></div>
        <div><Label htmlFor="to">To</Label><Input id="to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} className="mt-1.5" /></div>
        {(from || to) && <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); }}>Clear</Button>}
      </div>
      {!q.isLoading && rows.length === 0 ? (
        <EmptyState title="No records" body="Changes you make to your portfolio will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-surface text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Date (local)</th><th className="px-4 py-3">Action</th><th className="px-4 py-3 text-right">Quantity</th><th className="px-4 py-3 text-right">Previous</th><th className="px-4 py-3 text-right">Cost basis</th><th className="px-4 py-3">Label</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2.5">{new Date(r.occurred_at).toLocaleString("en-US")}</td>
                  <td className="px-4 py-2.5 capitalize">{r.action}</td>
                  <td className="tabular px-4 py-2.5 text-right">{formatXrp(r.quantity)}</td>
                  <td className="tabular px-4 py-2.5 text-right">{r.previous_quantity === null ? "—" : formatXrp(r.previous_quantity)}</td>
                  <td className="tabular px-4 py-2.5 text-right">{r.cost_basis_usd === null ? "—" : formatUsd(r.cost_basis_usd)}</td>
                  <td className="px-4 py-2.5 text-xs uppercase text-muted-foreground">{r.source === "demo" ? "Demo" : "User-reported"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {page + 1} of {pages}</span>
            <div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button></div>
          </div>
        </div>
      )}
    </>
  );
}
