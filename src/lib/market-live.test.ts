import { describe, expect, it } from "vitest";
import { LIVE_POLL_MS, LIVE_UPDATE_MS, mergeLiveQuote, parseCoinbaseHeartbeat, parseCoinbaseRest, parseCoinbaseTicker, type LiveTick, type Quote } from "./market";

const base: Quote = {
  status: "live", priceUsd: 2, change24hPct: 1, high24h: 2.1, low24h: 1.9,
  volume24h: 5_000_000, marketCap: 100_000_000, source: "CoinGecko",
  providerUpdatedAt: null, fetchedAt: "2026-10-23T08:00:00.000Z",
};
const tick = (over: Partial<LiveTick> = {}): LiveTick => ({ price: 2.5, open24h: 2, high24h: 2.6, low24h: 1.95, volume24h: 1000, time: "2026-10-23T08:00:01.000Z", checkedAt: "2026-10-23T08:00:01.000Z", ...over });

describe("live market ticker", () => {
  it("screen refresh interval is 100ms", () => {
    expect(LIVE_UPDATE_MS).toBe(100);
  });

  it("backup price check runs every second", () => {
    expect(LIVE_POLL_MS).toBe(1000);
  });

  it("parses a Coinbase XRP-USD ticker frame", () => {
    const t = parseCoinbaseTicker({ type: "ticker", product_id: "XRP-USD", price: "2.5", open_24h: "2", high_24h: "2.6", low_24h: "1.95", volume_24h: "1000", time: "2026-10-23T08:00:01.000Z" });
    expect(t).toEqual(tick());
  });

  it("ignores other products and malformed prices", () => {
    expect(parseCoinbaseTicker({ type: "ticker", product_id: "BTC-USD", price: "1", time: "2026-10-23T08:00:01Z" })).toBeNull();
    expect(parseCoinbaseTicker({ type: "ticker", product_id: "XRP-USD", price: "abc", time: "2026-10-23T08:00:01Z" })).toBeNull();
    expect(parseCoinbaseHeartbeat({ type: "heartbeat", product_id: "BTC-USD", time: "2026-10-23T08:00:01Z" })).toBeNull();
  });

  it("parses heartbeats and REST backup responses", () => {
    expect(parseCoinbaseHeartbeat({ type: "heartbeat", product_id: "XRP-USD", time: "2026-10-23T08:00:05Z" })).toBe("2026-10-23T08:00:05Z");
    const now = new Date("2026-10-23T08:00:09.000Z");
    const r = parseCoinbaseRest({ price: "1.27", volume: "10", time: "2026-10-23T08:00:08Z" }, { open: "1.3", high: "1.32", low: "1.26" }, now)!;
    expect(r.price).toBe(1.27);
    expect(r.open24h).toBe(1.3);
    expect(r.checkedAt).toBe(now.toISOString());
  });

  it("uses the live price and computes 24h change from the 24h open", () => {
    const q = mergeLiveQuote(base, tick(), new Date("2026-10-23T08:00:02.000Z").getTime())!;
    expect(q.priceUsd).toBe(2.5);
    expect(q.change24hPct).toBe(25);
    expect(q.marketCap).toBe(100_000_000);
    expect(q.source).toContain("Coinbase");
  });

  it("stays live with no trades while heartbeats keep confirming the price", () => {
    const t = tick({ time: "2026-10-23T08:00:00.000Z", checkedAt: "2026-10-23T08:01:00.000Z" });
    const q = mergeLiveQuote(base, t, new Date("2026-10-23T08:01:01.000Z").getTime())!;
    expect(q.status).toBe("live");
    expect(q.fetchedAt).toBe(t.checkedAt);
  });

  it("falls back to the cached quote when the feed hasn't confirmed the price for over 30 seconds", () => {
    const t = tick({ checkedAt: "2026-10-23T08:00:00.000Z" });
    expect(mergeLiveQuote(base, t, new Date("2026-10-23T08:00:31.000Z").getTime())).toBe(base);
  });
});
