import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero, Prose, DraftNotice } from "@/components/site/PublicShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | XRP Ventures" },
      { name: "description", content: "Draft privacy policy: what XRP Ventures collects, why, and your rights including data deletion." },
      { property: "og:title", content: "Privacy Policy | XRP Ventures" },
      { property: "og:description", content: "Draft privacy policy: what XRP Ventures collects, why, and your rights including data deletion." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell>
      <PageHero eyebrow="Legal" title="Privacy Policy" intro="Last updated: October 2026" />
      <Prose>
<DraftNotice />
<h2>What we collect</h2><ul><li>Account data: email, display name, authentication metadata from our provider.</li><li>Content you provide: holdings, cost basis, notes, support messages and attachments.</li><li>Security data: sign-in and security events, browser user-agent.</li></ul>
<h2>How we use it</h2><p>To operate the service, secure accounts, provide support and comply with law. We do not sell personal data.</p>
<h2>Sharing</h2><p>With infrastructure providers (hosting, database, authentication, email) under contract, and when required by law. The leaderboard shows only a pseudonym and optional figures you opt in to share.</p>
<h2>Retention & deletion</h2><p>We keep data while your account is open. To close your account and delete your data, open a support ticket (category: account) or use the Contact page. Audit and security records may be retained as required for security and legal purposes.</p>
<h2>Your rights</h2><p>Depending on where you live (for example under California law), you may request access, correction or deletion of your data.</p>
<h2>Cookies</h2><p>See Cookie preferences. We use only storage that is strictly necessary to keep you signed in.</p>
      </Prose>
    </PublicShell>
  );
}
