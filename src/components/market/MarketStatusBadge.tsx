import type { Quote } from "@/lib/market";
import { formatDistanceToNowStrict } from "date-fns";

export function MarketStatusBadge({ quote }: { quote: Quote }) {
  const styles = {
    live: "border-success/30 bg-success/10 text-success",
    stale: "border-warning/30 bg-warning/10 text-warning",
    unavailable: "border-destructive/30 bg-destructive/10 text-destructive",
  }[quote.status];
  const label = { live: "Live", stale: "Stale data", unavailable: "Unavailable" }[quote.status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${quote.status === "live" ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

export function MarketSourceLine({ quote }: { quote: Quote }) {
  return (
    <p className="text-xs text-muted-foreground">
      Source: {quote.source}
      {quote.fetchedAt && (
        <>
          {" · "}Updated{" "}
          <time dateTime={quote.fetchedAt} title={new Date(quote.fetchedAt).toUTCString()}>
            {formatDistanceToNowStrict(new Date(quote.fetchedAt), { addSuffix: true })}
          </time>{" "}
          ({new Date(quote.fetchedAt).toLocaleTimeString("en-US", { timeZoneName: "short" })})
        </>
      )}
      {quote.status !== "live" && quote.message && <span className="block text-warning">{quote.message}. The price shown is not current.</span>}
    </p>
  );
}
