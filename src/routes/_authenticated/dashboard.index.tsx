import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PageTitle, StatCard, EmptyState } from "@/components/app/AppShell";
import { PriceChart } from "@/components/market/PriceChart";
import { MarketSourceLine, MarketStatusBadge } from "@/components/market/MarketStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useXrpQuote } from "@/lib/live-ticker";
import { positionsQuery } from "@/lib/queries";
import { formatPct, formatPrice, formatUsd, formatXrp, portfolioTotals } from "@/lib/finance";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { balanceQuery } from "@/lib/ledger";
import { DepositContactDialog } from "@/components/app/DepositContactDialog";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Overview | XRP Ventures" }] }),
  component: Overview,
});

function Overview() {
  const { user } = useAuth();
  const balance = useQuery({ ...balanceQuery(user?.id ?? ""), enabled: !!user });
  const quote = useXrpQuote();
  const positions = useQuery(positionsQuery());
  const activity = useQuery({
    queryKey: ["history", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tracked_transactions").select("id, action, quantity, previous_quantity, source, occurred_at").order("occurred_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });
  const q = quote.data;
  const live = q?.status === "live" ? q.priceUsd : null;
  const all = positions.data ?? [];
  const reported = all.filter((p) => p.source === "user_reported");
  const demo = all.filter((p) => p.source === "demo");
  const t = portfolioTotals(reported, live);
  const tDemo = portfolioTotals(demo, live);

  if (positions.isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <>
      <PageTitle title="Overview" description="Estimated values use the live XRP price. Holdings are user-reported." action={q && <MarketStatusBadge quote={q} />} />
      <div className="mb-4 rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Account balance (USD)</p>
            <p className="tabular mt-2 text-3xl font-semibold tracking-tight">{balance.data === undefined ? "—" : formatUsd(balance.data)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/transactions" className="text-xs text-primary hover:underline">View history</Link>
            <DepositContactDialog />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tracked XRP (user-reported)" value={formatXrp(t.quantity)} hint={`${t.positionCount} entr${t.positionCount === 1 ? "y" : "ies"}`} />
        <StatCard label="Estimated value (USD)" value={live === null ? "Unavailable" : formatUsd(t.value)} hint="Quantity × current market price" />
        <StatCard label="Current XRP price" value={formatPrice(q?.priceUsd)} hint={q?.status !== "live" ? "Not current — see status" : "Live"} />
        <StatCard label="24h market movement" value={formatPct(q?.change24hPct)} tone={(q?.change24hPct ?? 0) >= 0 ? "up" : "down"} hint="XRP price change, not your return" />
      </div>
      {q && <div className="mt-2"><MarketSourceLine quote={q} /></div>}

      {all.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Your portfolio is empty" body="Add the XRP you already hold elsewhere to see its estimated value. Nothing is deposited or moved." action={<Button asChild><Link to="/dashboard/portfolio">Add a holding</Link></Button>} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h3 className="text-sm font-medium">Unrealized P/L</h3>
            {t.pnl === null ? (
              <p className="mt-3 text-sm text-muted-foreground">{live === null ? "Unavailable while the market price is not current." : "Add a cost basis to your holdings to estimate profit or loss."}</p>
            ) : (
              <>
                <p className={`tabular mt-3 text-2xl font-semibold ${t.pnl.gte(0) ? "text-success" : "text-destructive"}`}>{formatUsd(t.pnl)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Based on {t.positionsWithBasis} of {t.positionCount} entries with a cost basis ({formatUsd(t.costBasis)}).</p>
              </>
            )}
            <h3 className="mt-6 text-sm font-medium">Allocation</h3>
            <div className="h-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[{ name: "User-reported XRP", v: t.quantity.toNumber() }, { name: "Demo XRP", v: tDemo.quantity.toNumber() }].filter((d) => d.v > 0)} dataKey="v" nameKey="name" innerRadius={45} outerRadius={65} stroke="none">
                    <Cell fill="var(--color-chart-1)" />
                    <Cell fill="var(--color-chart-3)" />
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${formatXrp(v)} XRP`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">100% XRP. More assets coming later.{demo.length > 0 && " Demo entries are excluded from totals above."}</p>
          </div>
          <div className="lg:col-span-2"><PriceChart height={260} /></div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between"><h3 className="text-sm font-medium">Recent activity</h3><Link to="/dashboard/transactions" className="text-xs text-primary hover:underline">View all</Link></div>
        {activity.data?.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>}
        <ul className="mt-3 divide-y">
          {activity.data?.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="capitalize">{a.action} {a.source === "demo" && <span className="ml-1 rounded bg-muted px-1.5 text-[10px] uppercase">Demo</span>}</span>
              <span className="tabular text-muted-foreground">{a.action === "removed" ? formatXrp(a.previous_quantity) : formatXrp(a.quantity)} XRP · {new Date(a.occurred_at).toLocaleDateString("en-US")}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
