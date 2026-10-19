import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site/PublicShell";
import { QuotePanel } from "@/components/market/QuotePanel";
import { PriceChart } from "@/components/market/PriceChart";
import { quoteQuery } from "@/lib/market.functions";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "XRP Markets — Live XRP/USD Price | XRP Ventures" },
      { name: "description", content: "Live XRP/USD price, 24h change, high, low, volume, market cap and interactive price history with source and timestamp." },
      { property: "og:title", content: "XRP Markets — Live XRP/USD Price" },
      { property: "og:description", content: "Live XRP market data from CoinGecko with clear freshness indicators." },
    ],
  }),
  loader: ({ context }) => context.queryClient.prefetchQuery(quoteQuery()),
  component: () => (
    <PublicShell>
      <PageHero eyebrow="Markets" title="XRP / USD" intro="Real market prices from CoinGecko. Data refreshes about every minute; if the provider is unavailable we tell you instead of showing an old price as current." />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6">
        <QuotePanel />
        <PriceChart height={380} />
        <p className="text-xs text-muted-foreground">Market data is provided for information only and may be delayed. It is not an offer or recommendation to buy or sell any asset.</p>
      </div>
    </PublicShell>
  ),
});
