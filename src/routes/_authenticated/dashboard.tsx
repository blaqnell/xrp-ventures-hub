import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell, USER_NAV } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | XRP Ventures" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AppShell nav={USER_NAV} title="Dashboard">
      <Outlet />
    </AppShell>
  ),
});
