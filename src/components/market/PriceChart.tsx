import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartQuery } from "@/lib/market.functions";
import { CHART_RANGES, type ChartRange } from "@/lib/market";
import { formatPrice } from "@/lib/finance";
import { Skeleton } from "@/components/ui/skeleton";

export function PriceChart({ height = 300 }: { height?: number }) {
  const [days, setDays] = useState<ChartRange>("7");
  const { data, isLoading } = useQuery(chartQuery(days));
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">XRP market price (USD)</h3>
          <p className="text-xs text-muted-foreground">Historical market prices — not investment returns.</p>
        </div>
        <div role="tablist" aria-label="Chart range" className="flex rounded-lg border bg-surface p-0.5">
          {CHART_RANGES.map((r) => (
            <button
              key={r.key}
              role="tab"
              aria-selected={days === r.key}
              onClick={() => setDays(r.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${days === r.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height }}>
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : !data || !data.ok ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            {data && !data.ok ? data.error : "Price history unavailable."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.points} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t) => new Date(t).toLocaleDateString("en-US", days === "1" ? { hour: "numeric" } : { month: "short", day: "numeric" })}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis dataKey="p" domain={["auto", "auto"]} tickFormatter={(v) => `$${Number(v).toFixed(2)}`} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={56} />
              <Tooltip
                contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(t) => new Date(Number(t)).toLocaleString("en-US")}
                formatter={(v: number) => [formatPrice(v), "Price"]}
              />
              <Area type="monotone" dataKey="p" stroke="var(--color-primary)" strokeWidth={2} fill="url(#pc-fill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {data?.ok && <p className="mt-3 text-xs text-muted-foreground">Source: {data.source} · Retrieved {new Date(data.fetchedAt).toLocaleString("en-US")}</p>}
    </div>
  );
}
