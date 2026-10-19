import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero, Prose, DraftNotice } from "@/components/site/PublicShell";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Security Practices | XRP Ventures" },
      { name: "description", content: "How XRP Ventures protects accounts and data: isolation policies, two-factor authentication, audit logging and responsible disclosure." },
      { property: "og:title", content: "Security Practices | XRP Ventures" },
      { property: "og:description", content: "How XRP Ventures protects accounts and data: isolation policies, two-factor authentication, audit logging and responsible disclosure." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell>
      <PageHero eyebrow="Security" title="Security practices" intro="How we protect your account and data. No system is immune to every attack; this is what we do to reduce risk." />
      <Prose>
<h2>Accounts</h2>
<ul><li>Passwords are handled by our authentication provider, checked against known-breached password lists, and never stored in application tables.</li><li>Email verification is required before sign-in.</li><li>Optional authenticator-app two-factor authentication (TOTP); mandatory for administrators.</li><li>Password recovery responses never reveal whether an email is registered.</li><li>The authentication provider rate-limits sign-in and recovery attempts.</li></ul>
<h2>Data</h2>
<ul><li>Database row-level security isolates each user&apos;s portfolio, preferences, notifications and conversations.</li><li>Administrator capabilities are enforced in the database, not only in the interface. Role changes, suspensions and setting changes are written to an append-only audit log.</li><li>Tracking history, messages and audit records cannot be edited or deleted after creation.</li><li>Market prices used for snapshots are fetched on our servers; client-supplied prices are never trusted.</li></ul>
<h2>Content & uploads</h2>
<ul><li>User content is rendered as plain text — never as HTML.</li><li>Attachments are limited to PNG, JPEG and PDF up to 5 MB, checked by file signature, and stored privately.</li><li>Messages and ticket creation are rate-limited.</li></ul>
<h2>Reporting a vulnerability</h2>
<p>Please report security issues through the Contact page with the subject &ldquo;Security&rdquo;. Do not access other users&apos; data while testing.</p>
      </Prose>
    </PublicShell>
  );
}
