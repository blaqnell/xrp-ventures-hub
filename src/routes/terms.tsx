import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero, Prose, DraftNotice } from "@/components/site/PublicShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | XRP Ventures" },
      { name: "description", content: "Draft terms of service for the XRP Ventures tracking platform." },
      { property: "og:title", content: "Terms of Service | XRP Ventures" },
      { property: "og:description", content: "Draft terms of service for the XRP Ventures tracking platform." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell>
      <PageHero eyebrow="Legal" title="Terms of Service" intro="Last updated: October 2026" />
      <Prose>
<DraftNotice />
<h2>1. The service</h2><p>XRP Ventures provides market information and tools to record digital-asset holdings you report. The service does not accept deposits, execute trades, custody assets, transmit money or provide investment, legal or tax advice.</p>
<h2>2. Eligibility & accounts</h2><p>You must be at least 18 and provide accurate information. You are responsible for safeguarding your credentials. We may suspend accounts that violate these terms.</p>
<h2>3. Your content</h2><p>You are responsible for the accuracy of holdings and messages you submit. Do not upload malicious files or content that infringes others&apos; rights.</p>
<h2>4. Market data</h2><p>Market data is provided by third parties &ldquo;as is&rdquo;, may be delayed or inaccurate, and must not be relied on for trading decisions.</p>
<h2>5. No warranties; limitation of liability</h2><p>To the extent permitted by law, the service is provided without warranties and XRP Ventures is not liable for losses arising from reliance on the service.</p>
<h2>6. Termination</h2><p>You may close your account at any time by contacting support.</p>
<h2>7. Changes</h2><p>We may update these terms and will notify users of material changes.</p>
      </Prose>
    </PublicShell>
  );
}
