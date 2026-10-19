import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import Decimal from "decimal.js";

/** Records a portfolio value snapshot using the server-fetched price (never a client-supplied one). */
export const recordSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { loadXrpQuote } = await import("./market.server");
    const quote = await loadXrpQuote();
    if (quote.status !== "live" || quote.priceUsd === null) {
      throw new Error("Live market price is unavailable, snapshot not recorded.");
    }
    const { data: positions, error } = await supabase
      .from("portfolio_positions")
      .select("quantity")
      .eq("source", "user_reported");
    if (error) throw new Error("Could not read positions");
    const qty = (positions ?? []).reduce((a, p) => a.plus(p.quantity), new Decimal(0));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("portfolio_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("taken_at", new Date(Date.now() - 60 * 60_000).toISOString());
    if ((count ?? 0) >= 6) throw new Error("Snapshot limit reached (6 per hour).");
    const { error: insErr } = await supabaseAdmin.from("portfolio_snapshots").insert({
      user_id: userId,
      total_quantity: qty.toFixed(8),
      price_usd: quote.priceUsd,
      value_usd: qty.mul(quote.priceUsd).toFixed(2),
      price_source: quote.source,
    });
    if (insErr) throw new Error("Could not save snapshot");
    return { ok: true };
  });
