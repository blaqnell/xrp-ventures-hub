import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero, Prose, DraftNotice } from "@/components/site/PublicShell";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform \u2014 How XRP Ventures Works" },
      { name: "description", content: "What the XRP Ventures tracking platform does, and what it deliberately does not do." },
      { property: "og:title", content: "Platform \u2014 How XRP Ventures Works" },
      { property: "og:description", content: "What the XRP Ventures tracking platform does, and what it deliberately does not do." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell>
      <PageHero eyebrow="Platform" title="What XRP Ventures does \u2014 and doesn't" intro="A transparent overview of the tracking platform." />
      <Prose>
<h2>What you can do</h2>
<ul><li>Follow live XRP/USD market data with source and timestamp.</li><li>Record XRP holdings you own elsewhere, with optional purchase date and cost basis.</li><li>See estimated market value and, where you provided a cost basis, unrealized profit or loss.</li><li>Keep a full, append-only tracking history and export it as CSV.</li><li>Open support tickets and chat with our team.</li><li>Optionally appear on the pseudonymous leaderboard.</li></ul>
<h2>What we don&apos;t do</h2>
<ul><li>No deposits, withdrawals or transfers.</li><li>No trading, order execution or brokerage.</li><li>No custody of keys or assets.</li><li>No investment advice or promised returns.</li></ul>
<h2>Data labels</h2>
<p>Every holding is labeled either <strong>user-reported</strong> (entered by you, not verified on-chain) or <strong>demo</strong> (sample data you explicitly loaded). Wallet connection and verified imports are planned but not yet available.</p>
<h2>Limitations</h2>
<p>Market data can be delayed or unavailable. Estimated values depend on that data and on the accuracy of what you enter. Values are estimates, not account balances.</p>
      </Prose>
    </PublicShell>
  );
}
