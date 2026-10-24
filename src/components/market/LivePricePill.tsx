import { Link } from "@tanstack/react-router";
import { useXrpQuote } from "@/lib/live-ticker";
import { formatPct, formatPrice } from "@/lib/finance";

/** Compact live XRP/USD price shown in every page header. */
export function LivePricePill({ to = "/markets" }: { to?: "/markets" | "/dashboard/markets" }) {
  const { data: q } = useXrpQuote();
  const live = q?.status === "live";
  const up = (q?.change24hPct ?? 0) >= 0;
  return (
    <Link
      to={to}
      aria-label={q?.priceUsd != null ? `XRP price ${formatPrice(q.priceUsd)}${live ? "" : " (not current)"}` : "XRP price loading"}
      className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs shadow-card hover:border-primary/40"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-success" : q ? "bg-warning" : "bg-muted-foreground"}`} aria-hidden />
      <span className="text-muted-foreground">XRP</span>
      <span className={`tabular font-semibold ${live ? "" : "text-muted-foreground"}`}>{q?.priceUsd != null ? formatPrice(q.priceUsd) : "—"}</span>
      {q?.change24hPct != null && <span className={`tabular hidden sm:inline ${up ? "text-success" : "text-destructive"}`}>{formatPct(q.change24hPct)}</span>}
    </Link>
  );
}
