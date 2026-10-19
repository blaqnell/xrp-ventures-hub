import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { MARKET_SOURCE, parseChart, type ChartRange } from "./market";

export const getXrpQuote = createServerFn({ method: "GET" }).handler(async () => {
  const { loadXrpQuote } = await import("./market.server");
  return loadXrpQuote();
});

const rangeSchema = z.object({ days: z.enum(["1", "7", "30", "90", "365"]) });

export const getXrpChart = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => rangeSchema.parse(input))
  .handler(async ({ data }) => {
    const { coinGeckoHeaders } = await import("./market.server");
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/ripple/market_chart?vs_currency=usd&days=${data.days}`,
        { headers: coinGeckoHeaders(), signal: ctrl.signal },
      );
      clearTimeout(timer);
      if (!res.ok) {
        return { ok: false as const, error: res.status === 429 ? "Provider rate limit reached — try again shortly." : "Price history is temporarily unavailable.", source: MARKET_SOURCE };
      }
      const points = parseChart(await res.json());
      if (!points) return { ok: false as const, error: "Provider returned invalid data.", source: MARKET_SOURCE };
      return { ok: true as const, points, source: MARKET_SOURCE, fetchedAt: new Date().toISOString() };
    } catch {
      return { ok: false as const, error: "Price history is temporarily unavailable.", source: MARKET_SOURCE };
    }
  });

export const quoteQuery = () =>
  queryOptions({
    queryKey: ["market", "xrp", "quote"],
    queryFn: () => getXrpQuote(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

export const chartQuery = (days: ChartRange) =>
  queryOptions({
    queryKey: ["market", "xrp", "chart", days],
    queryFn: () => getXrpChart({ data: { days } }),
    staleTime: 5 * 60_000,
  });
