import {
  CACHE_TTL_MS,
  MARKET_SOURCE,
  classifyFreshness,
  parseCoinGeckoMarket,
  type Quote,
} from "./market";

type Row = {
  price_usd: number;
  change_24h_pct: number | null;
  high_24h: number | null;
  low_24h: number | null;
  volume_24h: number | null;
  market_cap: number | null;
  source: string;
  provider_updated_at: string | null;
  fetched_at: string;
};

function toQuote(row: Row, status: Quote["status"], message?: string): Quote {
  return {
    status,
    priceUsd: Number(row.price_usd),
    change24hPct: row.change_24h_pct === null ? null : Number(row.change_24h_pct),
    high24h: row.high_24h === null ? null : Number(row.high_24h),
    low24h: row.low_24h === null ? null : Number(row.low_24h),
    volume24h: row.volume_24h === null ? null : Number(row.volume_24h),
    marketCap: row.market_cap === null ? null : Number(row.market_cap),
    source: row.source,
    providerUpdatedAt: row.provider_updated_at,
    fetchedAt: row.fetched_at,
    ...(message ? { message } : {}),
  };
}

export function coinGeckoHeaders(): HeadersInit {
  const key = process.env["COINGECKO_API_KEY"];
  return key ? { accept: "application/json", "x-cg-demo-api-key": key } : { accept: "application/json" };
}

/** Server-only: returns cached quote, refreshing from the provider at most once per CACHE_TTL_MS. */
export async function loadXrpQuote(): Promise<Quote> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: asset } = await supabaseAdmin.from("assets").select("id").eq("symbol", "XRP").single();
  if (!asset) return emptyQuote("Asset not configured");

  const { data: latest } = await supabaseAdmin
    .from("market_price_snapshots")
    .select("price_usd,change_24h_pct,high_24h,low_24h,volume_24h,market_cap,source,provider_updated_at,fetched_at")
    .eq("asset_id", asset.id)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && Date.now() - new Date(latest.fetched_at).getTime() < CACHE_TTL_MS) {
    return toQuote(latest as Row, "live");
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ripple",
      { headers: coinGeckoHeaders(), signal: ctrl.signal },
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Provider responded ${res.status}`);
    const parsed = parseCoinGeckoMarket(await res.json());
    if (!parsed) throw new Error("Provider response failed validation");
    const { data: inserted, error } = await supabaseAdmin
      .from("market_price_snapshots")
      .insert({ asset_id: asset.id, source: MARKET_SOURCE, ...parsed })
      .select("price_usd,change_24h_pct,high_24h,low_24h,volume_24h,market_cap,source,provider_updated_at,fetched_at")
      .single();
    if (error || !inserted) throw new Error("Could not cache quote");
    return toQuote(inserted as Row, "live");
  } catch (e) {
    const msg = e instanceof Error && e.message.startsWith("Provider") ? e.message : "Market data provider unreachable";
    if (latest) {
      const status = classifyFreshness(latest.fetched_at);
      return toQuote(latest as Row, status, msg);
    }
    return emptyQuote(msg);
  }
}

function emptyQuote(message: string): Quote {
  return {
    status: "unavailable",
    priceUsd: null,
    change24hPct: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    marketCap: null,
    source: MARKET_SOURCE,
    providerUpdatedAt: null,
    fetchedAt: null,
    message,
  };
}
