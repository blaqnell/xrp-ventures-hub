import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, PageHero } from "@/components/site/PublicShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Complaints | XRP Ventures" },
      { name: "description", content: "Contact XRP Ventures support, file a complaint, report a security issue or request account deletion." },
      { property: "og:title", content: "Contact XRP Ventures" },
      { property: "og:description", content: "Support, complaints, security reports and data deletion requests." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { user } = useAuth();
  const items = [
    ["General support", "Questions about your account, portfolio tracking or market data."],
    ["Complaints", "Tell us what went wrong. We acknowledge complaints and respond in writing."],
    ["Security reports", "Report a vulnerability or suspicious account activity. Choose the “security” category."],
    ["Data deletion & account closure", "Request deletion of your account and personal data. Choose the “account” category."],
  ];
  return (
    <PublicShell>
      <PageHero eyebrow="Contact" title="Contact & complaints" intro="Support is handled through secure, authenticated tickets so we can verify who we're talking to." />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2">
        {items.map(([t, b]) => (
          <div key={t} className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="font-medium">{t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{b}</p>
          </div>
        ))}
        <div className="rounded-2xl border bg-surface p-6 md:col-span-2">
          <p className="text-sm text-muted-foreground">
            {user ? "Open a ticket from your dashboard — our team replies in the same thread." : "Sign in or create a free account to open a support ticket."}
          </p>
          <div className="mt-4 flex gap-3">
            {user ? (
              <Button asChild><Link to="/dashboard/support">Open support</Link></Button>
            ) : (
              <>
                <Button asChild><Link to="/login">Sign in</Link></Button>
                <Button asChild variant="outline"><Link to="/signup">Create account</Link></Button>
              </>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
