import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero, Prose, DraftNotice } from "@/components/site/PublicShell";

export const Route = createFileRoute("/risk-disclosure")({
  head: () => ({
    meta: [
      { title: "Risk Disclosure | XRP Ventures" },
      { name: "description", content: "Important risks of XRP and digital assets, and the limits of the XRP Ventures tracking platform." },
      { property: "og:title", content: "Risk Disclosure | XRP Ventures" },
      { property: "og:description", content: "Important risks of XRP and digital assets, and the limits of the XRP Ventures tracking platform." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell>
      <PageHero eyebrow="Legal" title="Risk Disclosure" intro="Please read carefully." />
      <Prose>
<DraftNotice />
<h2>Volatility</h2><p>XRP and other digital assets are highly volatile. Prices can fall sharply and quickly, and you can lose all of the value of your holdings. Historical prices do not guarantee future returns.</p>
<h2>No advice</h2><p>Nothing on XRP Ventures is investment, financial, legal or tax advice, or a recommendation to buy, sell or hold any asset.</p>
<h2>Tracking only</h2><p>We do not hold your funds. Values shown are estimates based on data you enter and third-party market prices and may be wrong or delayed.</p>
<h2>Regulatory status</h2><p>XRP Ventures is not licensed, registered, insured or audited by any authority. The legal status of digital assets varies by jurisdiction and may change.</p>
<h2>Before any real-money services</h2><p>Any future introduction of custody, trading or money movement would require appropriate legal and compliance review, including securities, investment-adviser, custody, money-transmission and AML/KYC requirements at the US federal and state level.</p>
      </Prose>
    </PublicShell>
  );
}
