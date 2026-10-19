import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTitle, EmptyState } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { recordSnapshot } from "@/lib/portfolio.functions";
import { formatPrice, formatUsd, formatXrp } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/dashboard/performance")({
  head: () => ({ meta: [{ title: "Performance | XRP Ventures" }] }),
  component: Performance,
});

function Performance() {
  const qc = useQueryClient();
  const record = useServerFn(recordSnapshot);
  const snaps = useQuery({
    queryKey: ["snapshots"],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_snapshots").select("*").order("taken_at", { ascending: true }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const m = useMutation({
    mutationFn: () => record(),
    onSuccess: () => { toast.success("Snapshot recorded at the live market price."); qc.invalidateQueries({ queryKey: ["snapshots"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not record snapshot"),
  });
  const data = (snaps.data ?? []).map((s) => ({ t: new Date(s.taken_at).getTime(), v: Number(s.value_usd), q: Number(s.total_quantity), p: Number(s.price_usd) }));
  return (
    <>
      <PageTitle
        title="Performance"
        description="Recorded snapshots of your user-reported holdings valued at the live market price at that moment. Changes reflect both market moves and your own edits — they are not verified returns."
        action={<Button onClick={() => m.mutate()} disabled={m.isPending}>{m.isPending ? "Recording…" : "Record snapshot now"}</Button>}
      />
      {data.length < 2 ? (
        <EmptyState title="Not enough data yet" body="Performance needs at least two snapshots. Record one now and again later — we never back-fill or estimate history you didn't record." />
      ) : (
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={data}>
                <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" })} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `$${Number(v).toLocaleString()}`} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} labelFormatter={(t) => new Date(Number(t)).toLocaleString("en-US")} formatter={(v: number) => [formatUsd(v), "Estimated value"]} />
                <Line dataKey="v" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {data.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Taken</th><th className="px-4 py-3 text-right">XRP</th><th className="px-4 py-3 text-right">Price</th><th className="px-4 py-3 text-right">Est. value</th></tr></thead>
            <tbody>
              {[...data].reverse().slice(0, 20).map((d) => (
                <tr key={d.t} className="border-t"><td className="px-4 py-2.5">{new Date(d.t).toLocaleString("en-US")}</td><td className="tabular px-4 py-2.5 text-right">{formatXrp(d.q)}</td><td className="tabular px-4 py-2.5 text-right">{formatPrice(d.p)}</td><td className="tabular px-4 py-2.5 text-right">{formatUsd(d.v)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
