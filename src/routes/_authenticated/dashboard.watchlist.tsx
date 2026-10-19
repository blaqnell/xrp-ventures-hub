import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTitle } from "@/components/app/AppShell";
import { QuotePanel } from "@/components/market/QuotePanel";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { xrpAssetQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard/watchlist")({
  head: () => ({ meta: [{ title: "Watchlist | XRP Ventures" }] }),
  component: Watchlist,
});

function Watchlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const asset = useQuery(xrpAssetQuery());
  const list = useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("watchlists").select("id, asset_id");
      if (error) throw error;
      return data;
    },
  });
  const entry = list.data?.find((w) => w.asset_id === asset.data?.id);
  const toggle = useMutation({
    mutationFn: async () => {
      const { error } = entry
        ? await supabase.from("watchlists").delete().eq("id", entry.id)
        : await supabase.from("watchlists").insert({ user_id: user!.id, asset_id: asset.data!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
    onError: () => toast.error("Could not update watchlist"),
  });
  return (
    <>
      <PageTitle title="Watchlist" description="Assets you're following. XRP is supported today; more assets are planned." action={<Button variant={entry ? "outline" : "default"} onClick={() => toggle.mutate()} disabled={!asset.data || toggle.isPending}>{entry ? "Remove XRP" : "Watch XRP"}</Button>} />
      {entry ? <QuotePanel /> : <p className="text-sm text-muted-foreground">Your watchlist is empty.</p>}
    </>
  );
}
