import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile | XRP Ventures" }] }),
  component: () => (
    <>
      <PageTitle title="Profile Settings" description="Display name, notification and leaderboard preferences." />
      <p className="text-sm text-muted-foreground">Profile editing is not finished yet.</p>
    </>
  ),
});
