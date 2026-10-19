import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/app/AppShell";
import { QuotePanel } from "@/components/market/QuotePanel";
import { PriceChart } from "@/components/market/PriceChart";

export const Route = createFileRoute("/_authenticated/dashboard/markets")({
  head: () => ({ meta: [{ title: "Markets | XRP Ventures" }] }),
  component: () => (
    <>
      <PageTitle title="Markets" description="Live XRP/USD market data from CoinGecko." />
      <div className="grid gap-6"><QuotePanel /><PriceChart height={360} /></div>
    </>
  ),
});
