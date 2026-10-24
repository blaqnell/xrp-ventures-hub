import { z } from "zod";

export const MARKET_SOURCE = "CoinGecko";
export const CACHE_TTL_MS = 60_000;
export const STALE_AFTER_MS = 5 * 60_000;

export type MarketStatus = "live" | "stale" | "unavailable";

export type Quote = {
  status: MarketStatus;
  priceUsd: number | null;
  change24hPct: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  source: string;
  providerUpdatedAt: string | null;
  fetchedAt: string | null;
  message?: string;
};

const num = z.number().finite();
export const coinGeckoMarketSchema = z
  .array(
    z.object({
      id: z.literal("ripple"),
      current_price: num.positive(),
      price_change_percentage_24h: num.nullable().optional(),
      high_24h: num.nullable().optional(),
      low_24h: num.nullable().optional(),
      total_volume: num.nullable().optional(),
      market_cap: num.nullable().optional(),
      last_updated: z.string().datetime({ offset: true }).nullable().optional(),
    }),
  )
  .min(1);

export function parseCoinGeckoMarket(json: unknown) {
  const r = coinGeckoMarketSchema.safeParse(json);
  if (!r.success) return null;
  const m = r.data[0]!;
  return {
    price_usd: m.current_price,
    change_24h_pct: m.price_change_percentage_24h ?? null,
    high_24h: m.high_24h ?? null,
    low_24h: m.low_24h ?? null,
    volume_24h: m.total_volume ?? null,
    market_cap: m.market_cap ?? null,
    provider_updated_at: m.last_updated ?? null,
  };
}

export const chartSchema = z.object({
  prices: z.array(z.tuple([num, num.positive()])).min(2),
});

export function parseChart(json: unknown, maxPoints = 240) {
  const r = chartSchema.safeParse(json);
  if (!r.success) return null;
  const pts = r.data.prices;
  const step = Math.max(1, Math.ceil(pts.length / maxPoints));
  const out = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  return out.map(([t, p]) => ({ t, p }));
}

/** A cached quote is "live" only while younger than STALE_AFTER_MS. */
export function classifyFreshness(fetchedAt: string | null, now = Date.now()): MarketStatus {
  if (!fetchedAt) return "unavailable";
  const age = now - new Date(fetchedAt).getTime();
  if (!Number.isFinite(age)) return "unavailable";
  return age <= STALE_AFTER_MS ? "live" : "stale";
}

export const CHART_RANGES = [
  { key: "1", label: "24H" },
  { key: "7", label: "7D" },
  { key: "30", label: "30D" },
  { key: "90", label: "90D" },
  { key: "365", label: "1Y" },
] as const;
export type ChartRange = (typeof CHART_RANGES)[number]["key"];

/* ---------- Live ticker (Coinbase Exchange public WebSocket + REST backup) ---------- */
export const LIVE_SOURCE = "Coinbase Exchange";
export const LIVE_WS_URL = "wss://ws-feed.exchange.coinbase.com";
export const LIVE_REST_URL = "https://api.exchange.coinbase.com/products/XRP-USD";
/** The screen is refreshed with the newest live tick at most this often. */
export const LIVE_UPDATE_MS = 100;
/** When the stream is silent this long, the price is fetched directly every LIVE_POLL_MS. */
export const LIVE_POLL_MS = 1000;
export const LIVE_SILENT_AFTER_MS = 2500;
/** A price not re-confirmed by the feed for this long is no longer treated as current. */
export const LIVE_STALE_AFTER_MS = 30_000;

export type LiveTick = {
  price: number;
  open24h: number | null;
  high24h: number | null;
  low24h: number | null;
  /** 24h volume in XRP */
  volume24h: number | null;
  /** Time of the last trade */
  time: string;
  /** Last time the feed confirmed this price is still the current one (trade, heartbeat or poll). */
  checkedAt: string;
};

const numStr = z.string().regex(/^\d+(\.\d+)?$/).transform(Number).pipe(z.number().finite());
const iso = z.string().datetime({ offset: true });
const tickerSchema = z.object({
  type: z.literal("ticker"),
  product_id: z.literal("XRP-USD"),
  price: numStr.pipe(z.number().positive()),
  open_24h: numStr.optional(),
  high_24h: numStr.optional(),
  low_24h: numStr.optional(),
  volume_24h: numStr.optional(),
  time: iso,
});

export function parseCoinbaseTicker(json: unknown): LiveTick | null {
  const r = tickerSchema.safeParse(json);
  if (!r.success) return null;
  const m = r.data;
  return { price: m.price, open24h: m.open_24h ?? null, high24h: m.high_24h ?? null, low24h: m.low_24h ?? null, volume24h: m.volume_24h ?? null, time: m.time, checkedAt: m.time };
}

const heartbeatSchema = z.object({ type: z.literal("heartbeat"), product_id: z.literal("XRP-USD"), time: iso });
/** Coinbase sends a heartbeat every second; it confirms the last price is still current. */
export function parseCoinbaseHeartbeat(json: unknown): string | null {
  const r = heartbeatSchema.safeParse(json);
  return r.success ? r.data.time : null;
}

const restTickerSchema = z.object({ price: numStr.pipe(z.number().positive()), volume: numStr.optional(), time: iso });
const restStatsSchema = z.object({ open: numStr, high: numStr, low: numStr });
/** Combine the REST /ticker and (optional) /stats responses into a tick. */
export function parseCoinbaseRest(ticker: unknown, stats: unknown, now = new Date()): LiveTick | null {
  const t = restTickerSchema.safeParse(ticker);
  if (!t.success) return null;
  const s = restStatsSchema.safeParse(stats);
  return {
    price: t.data.price,
    open24h: s.success ? s.data.open : null,
    high24h: s.success ? s.data.high : null,
    low24h: s.success ? s.data.low : null,
    volume24h: t.data.volume ?? null,
    time: t.data.time,
    checkedAt: now.toISOString(),
  };
}

/** Overlay a live tick on the cached quote. Falls back to the cached quote when the feed hasn't confirmed the price recently. */
export function mergeLiveQuote(base: Quote | undefined, tick: LiveTick | null, now = Date.now()): Quote | undefined {
  if (!tick) return base;
  const age = now - new Date(tick.checkedAt).getTime();
  if (!Number.isFinite(age) || age > LIVE_STALE_AFTER_MS) return base;
  const change = tick.open24h && tick.open24h > 0 ? ((tick.price - tick.open24h) / tick.open24h) * 100 : (base?.change24hPct ?? null);
  const volumeUsd = base?.volume24h ?? (tick.volume24h !== null ? tick.volume24h * tick.price : null);
  return {
    status: "live",
    priceUsd: tick.price,
    change24hPct: change,
    high24h: tick.high24h ?? base?.high24h ?? null,
    low24h: tick.low24h ?? base?.low24h ?? null,
    volume24h: volumeUsd,
    marketCap: base?.marketCap ?? null,
    source: base?.marketCap != null ? `${LIVE_SOURCE} (price) · ${base.source} (market cap)` : LIVE_SOURCE,
    providerUpdatedAt: tick.time,
    fetchedAt: tick.checkedAt,
  };
}
