import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageTitle, EmptyState } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications | XRP Ventures" }] }),
  component: Notifications,
});

function Notifications() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const rows = list.data ?? [];
  const unread = rows.some((r) => !r.read_at);
  return (
    <>
      <PageTitle title="Notifications" action={unread && <Button size="sm" variant="outline" onClick={() => markAll.mutate()}>Mark all read</Button>} />
      {!list.isLoading && rows.length === 0 ? (
        <EmptyState title="No notifications" body="Account, support and security updates will show up here." />
      ) : (
        <ul className="divide-y rounded-2xl border bg-card shadow-card">
          {rows.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className={n.read_at ? "" : "font-medium"}>{!n.read_at && <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />}{n.title}</p>
                {n.body && <p className="mt-0.5 text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-US")}</p>
              </div>
              {n.link?.startsWith("/") && <Link to={n.link} className="shrink-0 text-xs text-primary hover:underline">Open</Link>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
