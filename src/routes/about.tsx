import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero, Prose, DraftNotice } from "@/components/site/PublicShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About XRP Ventures" },
      { name: "description", content: "XRP Ventures is an independent XRP market information and portfolio tracking platform." },
      { property: "og:title", content: "About XRP Ventures" },
      { property: "og:description", content: "XRP Ventures is an independent XRP market information and portfolio tracking platform." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell>
      <PageHero eyebrow="About" title="About XRP Ventures" intro="An independent platform for following the XRP market and tracking your own holdings." />
      <Prose>
<p>XRP Ventures was created to give XRP holders a calm, precise view of the market and of what they own — without asking them to hand over funds or keys.</p>
<h2>Our principles</h2>
<ul><li><strong>Real data or no data.</strong> We show market figures with their source and age, and flag them when stale.</li><li><strong>No invented numbers.</strong> We never fabricate balances, returns or testimonials.</li><li><strong>Privacy first.</strong> Your records are yours; sharing is opt-in.</li></ul>
<h2>Independence</h2>
<p>XRP Ventures is not affiliated with, endorsed by or sponsored by Ripple Labs Inc. We hold no licenses, partnerships, audits or insurance at this time, and we do not claim otherwise.</p>
      </Prose>
    </PublicShell>
  );
}
