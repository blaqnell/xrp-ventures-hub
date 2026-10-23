import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/app/AppShell";
import { QuotePanel } from "@/components/market/QuotePanel";
import { PriceChart } from "@/components/market/PriceChart";

export const Route = createFileRoute("/_authenticated/dashboard/markets")({
  head: () => ({ meta: [{ title: "Markets | XRP Ventures" }] }),
  component: () => (
    <>
      <PageTitle title="Markets" description="Real-time XRP/USD from Coinbase Exchange, refreshed up to every 100ms. Volume and market cap from CoinGecko." />
      <div className="grid gap-6"><QuotePanel /><PriceChart height={360} /></div>
    </>
  ),
});
