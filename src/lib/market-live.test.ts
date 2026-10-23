import { describe, expect, it } from "vitest";
import { LIVE_UPDATE_MS, mergeLiveQuote, parseCoinbaseTicker, type Quote } from "./market";

const base: Quote = {
  status: "live", priceUsd: 2, change24hPct: 1, high24h: 2.1, low24h: 1.9,
  volume24h: 5_000_000, marketCap: 100_000_000, source: "CoinGecko",
  providerUpdatedAt: null, fetchedAt: "2026-10-23T08:00:00.000Z",
};

describe("live market ticker", () => {
  it("screen refresh interval is 100ms", () => {
    expect(LIVE_UPDATE_MS).toBe(100);
  });

  it("parses a Coinbase XRP-USD ticker frame", () => {
    const t = parseCoinbaseTicker({ type: "ticker", product_id: "XRP-USD", price: "2.5", open_24h: "2", high_24h: "2.6", low_24h: "1.95", time: "2026-10-23T08:00:01.000Z" });
    expect(t).toEqual({ price: 2.5, open24h: 2, high24h: 2.6, low24h: 1.95, time: "2026-10-23T08:00:01.000Z" });
  });

  it("ignores other products and malformed prices", () => {
    expect(parseCoinbaseTicker({ type: "ticker", product_id: "BTC-USD", price: "1", time: "2026-10-23T08:00:01Z" })).toBeNull();
    expect(parseCoinbaseTicker({ type: "ticker", product_id: "XRP-USD", price: "abc", time: "2026-10-23T08:00:01Z" })).toBeNull();
  });

  it("uses the live price, its timestamp and computes 24h change from the 24h open", () => {
    const tick = { price: 2.5, open24h: 2, high24h: 2.6, low24h: 1.95, time: "2026-10-23T08:00:01.000Z" };
    const q = mergeLiveQuote(base, tick, new Date("2026-10-23T08:00:02.000Z").getTime())!;
    expect(q.priceUsd).toBe(2.5);
    expect(q.change24hPct).toBe(25);
    expect(q.fetchedAt).toBe(tick.time);
    expect(q.marketCap).toBe(100_000_000);
    expect(q.source).toContain("Coinbase");
  });

  it("falls back to the cached quote when the live tick is older than 30 seconds", () => {
    const tick = { price: 9, open24h: null, high24h: null, low24h: null, time: "2026-10-23T08:00:00.000Z" };
    expect(mergeLiveQuote(base, tick, new Date("2026-10-23T08:00:31.000Z").getTime())).toBe(base);
  });
});
