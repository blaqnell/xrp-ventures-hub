import { createFileRoute } from "@tanstack/react-router";
import { PublicShell, PageHero, Prose, DraftNotice } from "@/components/site/PublicShell";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Preferences | XRP Ventures" },
      { name: "description", content: "XRP Ventures uses only strictly necessary storage. No advertising or tracking cookies." },
      { property: "og:title", content: "Cookie Preferences | XRP Ventures" },
      { property: "og:description", content: "XRP Ventures uses only strictly necessary storage. No advertising or tracking cookies." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell>
      <PageHero eyebrow="Legal" title="Cookie preferences" intro="We keep this simple." />
      <Prose>
<p>XRP Ventures uses only strictly necessary browser storage to keep you signed in and remember your session. We do not use advertising, analytics or cross-site tracking cookies, so there is nothing to opt out of.</p>
<p>If we ever add optional cookies, we will ask for your consent here first.</p>
      </Prose>
    </PublicShell>
  );
}
