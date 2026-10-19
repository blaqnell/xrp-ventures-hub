import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { PageTitle, EmptyState } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv, positionsQuery, xrpAssetQuery } from "@/lib/queries";
import { quoteQuery } from "@/lib/market.functions";
import { formatUsd, formatXrp, parseQuantity, parseUsd, positionValue, unrealizedPnl } from "@/lib/finance";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio | XRP Ventures" }] }),
  component: Portfolio,
});

type Pos = NonNullable<ReturnType<typeof usePositions>["data"]>[number];
const usePositions = () => useQuery(positionsQuery());

function Portfolio() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const positions = usePositions();
  const asset = useQuery(xrpAssetQuery());
  const quote = useQuery(quoteQuery());
  const price = quote.data?.status === "live" ? quote.data.priceUsd : null;
  const [editing, setEditing] = useState<Pos | "new" | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["positions"] });
    qc.invalidateQueries({ queryKey: ["history"] });
  };

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolio_positions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Entry removed. It remains in your tracking history."); refresh(); },
    onError: () => toast.error("Could not remove entry."),
  });

  const demo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("portfolio_positions").insert({ user_id: user!.id, asset_id: asset.data!.id, quantity: "1000", cost_basis_usd: null, source: "demo", note: "Demo entry — not a real holding" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Demo entry added (clearly labeled)."); refresh(); },
    onError: () => toast.error("Could not add demo entry."),
  });

  const rows = positions.data ?? [];
  const hasDemo = rows.some((r) => r.source === "demo");

  return (
    <>
      <PageTitle
        title="Portfolio"
        description="Holdings you report. Not verified on-chain. Nothing is deposited or held by XRP Ventures."
        action={
          <div className="flex flex-wrap gap-2">
            {rows.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => downloadCsv("xrp-ventures-holdings.csv", [["asset", "quantity", "cost_basis_usd", "acquired_on", "source", "note", "created_at"], ...rows.map((r) => [r.assets?.symbol ?? "XRP", String(r.quantity), r.cost_basis_usd === null ? null : String(r.cost_basis_usd), r.acquired_on, r.source, r.note, r.created_at])])}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            )}
            <Button size="sm" onClick={() => setEditing("new")} disabled={!asset.data}><Plus className="h-4 w-4" /> Add holding</Button>
          </div>
        }
      />
      {positions.isLoading ? (
        <Skeleton className="h-60 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No holdings yet"
          body="Add XRP you own elsewhere. You can optionally record the purchase date and total cost to estimate profit or loss. Want to explore first? Load one clearly labeled demo entry."
          action={<div className="flex justify-center gap-2"><Button onClick={() => setEditing("new")}>Add holding</Button><Button variant="outline" onClick={() => demo.mutate()} disabled={demo.isPending || !asset.data}>Load demo entry</Button></div>}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface text-left text-xs text-muted-foreground">
              <tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3 text-right">Quantity</th><th className="px-4 py-3 text-right">Est. value</th><th className="px-4 py-3 text-right">Cost basis</th><th className="px-4 py-3 text-right">Unrealized P/L</th><th className="px-4 py-3">Acquired</th><th className="px-4 py-3">Label</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pnl = price === null ? null : unrealizedPnl(r.quantity, price, r.cost_basis_usd);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{r.assets?.symbol}{r.note && <p className="max-w-[180px] truncate text-xs font-normal text-muted-foreground">{r.note}</p>}</td>
                    <td className="tabular px-4 py-3 text-right">{formatXrp(r.quantity)}</td>
                    <td className="tabular px-4 py-3 text-right">{price === null ? "—" : formatUsd(positionValue(r.quantity, price))}</td>
                    <td className="tabular px-4 py-3 text-right">{r.cost_basis_usd === null ? <span className="text-muted-foreground">Unknown</span> : formatUsd(r.cost_basis_usd)}</td>
                    <td className={`tabular px-4 py-3 text-right ${pnl === null ? "text-muted-foreground" : pnl.gte(0) ? "text-success" : "text-destructive"}`}>{pnl === null ? "—" : formatUsd(pnl)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.acquired_on ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${r.source === "demo" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{r.source === "demo" ? "Demo" : "User-reported"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => confirm("Remove this entry? Your history will keep a record.") && del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {price === null && <p className="border-t px-4 py-3 text-xs text-warning">Live price unavailable — values and P/L are hidden until the market feed recovers.</p>}
          {!hasDemo && <div className="border-t px-4 py-3 text-right"><Button variant="link" size="sm" onClick={() => demo.mutate()} disabled={demo.isPending}>Load labeled demo entry</Button></div>}
        </div>
      )}
      {editing && asset.data && user && (
        <PositionDialog position={editing === "new" ? null : editing} assetId={asset.data.id} userId={user.id} onClose={() => setEditing(null)} onSaved={refresh} />
      )}
    </>
  );
}

function PositionDialog({ position, assetId, userId, onClose, onSaved }: { position: Pos | null; assetId: string; userId: string; onClose: () => void; onSaved: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const quantity = parseQuantity(String(fd.get("quantity") ?? ""));
    if (!quantity) return setErr("Enter a positive quantity with up to 8 decimals.");
    const cost = parseUsd(String(fd.get("cost") ?? ""));
    if (cost === undefined) return setErr("Cost basis must be a dollar amount with up to 2 decimals, or left blank.");
    const acquired = String(fd.get("acquired") ?? "") || null;
    if (acquired && (isNaN(Date.parse(acquired)) || new Date(acquired) > new Date())) return setErr("Purchase date can't be in the future.");
    const note = String(fd.get("note") ?? "").trim().slice(0, 500) || null;
    setBusy(true);
    const payload = { quantity, cost_basis_usd: cost, acquired_on: acquired, note };
    const { error } = position
      ? await supabase.from("portfolio_positions").update(payload).eq("id", position.id)
      : await supabase.from("portfolio_positions").insert({ ...payload, user_id: userId, asset_id: assetId, source: "user_reported" });
    setBusy(false);
    if (error) return setErr(/row-level|suspend/i.test(error.message) ? "Your account can't make changes right now." : "Could not save. Please check the values.");
    toast.success(position ? "Holding updated" : "Holding added");
    onSaved();
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{position ? "Edit holding" : "Add XRP holding"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div><Label htmlFor="quantity">Quantity (XRP)</Label><Input id="quantity" name="quantity" inputMode="decimal" defaultValue={position ? String(position.quantity) : ""} className="mt-1.5" required /></div>
          <div><Label htmlFor="cost">Total cost basis (USD, optional)</Label><Input id="cost" name="cost" inputMode="decimal" placeholder="Leave blank if unknown" defaultValue={position?.cost_basis_usd === null || !position ? "" : String(position.cost_basis_usd)} className="mt-1.5" /></div>
          <div><Label htmlFor="acquired">Purchase date (optional)</Label><Input id="acquired" name="acquired" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={position?.acquired_on ?? ""} className="mt-1.5" /></div>
          <div><Label htmlFor="note">Note (optional)</Label><Textarea id="note" name="note" maxLength={500} defaultValue={position?.note ?? ""} className="mt-1.5" /></div>
          <p className="text-xs text-muted-foreground">This entry will be labeled <strong>user-reported</strong> and is not verified on any blockchain.</p>
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy}>{busy ? "Saving…" : "Save"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
