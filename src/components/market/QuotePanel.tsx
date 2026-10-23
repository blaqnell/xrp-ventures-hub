import { useXrpQuote } from "@/lib/live-ticker";
import { formatCompact, formatPct, formatPrice } from "@/lib/finance";
import { MarketSourceLine, MarketStatusBadge } from "./MarketStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

export function QuotePanel({ compact = false }: { compact?: boolean }) {
  const { data: q, isLoading, isError } = useXrpQuote();
  if (isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (isError || !q)
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        Market data is unavailable right now. No price is being shown.
      </div>
    );
  const up = (q.change24hPct ?? 0) >= 0;
  const stats = [
    ["24h High", formatPrice(q.high24h)],
    ["24h Low", formatPrice(q.low24h)],
    ["24h Volume", formatCompact(q.volume24h)],
    ["Market Cap", formatCompact(q.marketCap)],
  ];
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">XRP / USD</p>
        <MarketStatusBadge quote={q} />
      </div>
      {q.priceUsd === null ? (
        <p className="mt-4 text-lg text-muted-foreground">Price unavailable</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-baseline gap-3">
          <span className={`tabular text-4xl font-semibold tracking-tight transition-colors ${q.status !== "live" ? "text-muted-foreground line-through decoration-warning/60" : ""}`}>
            {formatPrice(q.priceUsd)}
          </span>
          <span className={`tabular text-sm font-medium ${up ? "text-success" : "text-destructive"}`}>
            {formatPct(q.change24hPct)} 24h
          </span>
        </div>
      )}
      {!compact && (
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="tabular mt-1 text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-5 border-t pt-3">
        <MarketSourceLine quote={q} />
      </div>
    </div>
  );
}
