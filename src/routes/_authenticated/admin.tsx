import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageTitle, StatCard } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | XRP Ventures" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  // Access is enforced by the database: non-staff get "Forbidden".
  const m = useQuery({
    queryKey: ["admin-metrics"],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_metrics");
      if (error) throw error;
      return data as Record<string, number | string | null>;
    },
  });
  return (
    <AppShell nav={[{ to: "/admin", label: "Overview", icon: () => null } as never]} title="Admin">
      <PageTitle title="Admin console" />
      {m.error ? <p className="text-sm text-destructive">{m.error instanceof Error ? m.error.message : "Access denied"}</p> : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Accounts" value={m.data?.["accounts"] ?? "—"} />
          <StatCard label="New (7 days)" value={m.data?.["new_7d"] ?? "—"} />
          <StatCard label="Open tickets" value={m.data?.["open_tickets"] ?? "—"} />
        </div>
      )}
    </AppShell>
  );
}
