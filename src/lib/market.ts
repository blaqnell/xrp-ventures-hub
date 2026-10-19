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
  const m = r.data[0];
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
