import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import {
  LIVE_POLL_MS,
  LIVE_REST_URL,
  LIVE_SILENT_AFTER_MS,
  LIVE_UPDATE_MS,
  LIVE_WS_URL,
  mergeLiveQuote,
  parseCoinbaseHeartbeat,
  parseCoinbaseRest,
  parseCoinbaseTicker,
  type LiveTick,
} from "./market";
import { quoteQuery } from "./market.functions";

/**
 * One shared live feed for the whole tab:
 * - Coinbase WebSocket: trades as they happen + a heartbeat every second confirming the price.
 * - If the stream is silent (blocked network, reconnecting), the price is fetched directly every second.
 * Subscribers are notified at most every LIVE_UPDATE_MS.
 */
let snapshot: LiveTick | null = null;
let pending: LiveTick | null = null;
let lastStreamMsg = 0;
let lastStats: unknown = null;
let lastStatsAt = 0;
let polling = false;
const listeners = new Set<() => void>();
let ws: WebSocket | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let retries = 0;

const latest = () => pending ?? snapshot;

function connect() {
  if (typeof WebSocket === "undefined") return;
  const sock = new WebSocket(LIVE_WS_URL);
  ws = sock;
  sock.onopen = () => {
    retries = 0;
    sock.send(JSON.stringify({ type: "subscribe", product_ids: ["XRP-USD"], channels: ["ticker", "heartbeat"] }));
  };
  sock.onmessage = (e) => {
    try {
      const msg = JSON.parse(String(e.data));
      const t = parseCoinbaseTicker(msg);
      if (t) {
        lastStreamMsg = Date.now();
        // ticker frames carry volume in XRP; keep it
        pending = t;
        return;
      }
      const hb = parseCoinbaseHeartbeat(msg);
      const cur = latest();
      if (hb) {
        lastStreamMsg = Date.now();
        if (cur) pending = { ...cur, checkedAt: hb };
      }
    } catch {
      /* ignore malformed frames */
    }
  };
  sock.onerror = () => sock.close();
  sock.onclose = () => {
    if (ws !== sock || listeners.size === 0) return;
    ws = null;
    reconnectTimer = setTimeout(connect, Math.min(10_000, 500 * 2 ** retries++));
  };
}

async function poll() {
  if (polling || Date.now() - lastStreamMsg < LIVE_SILENT_AFTER_MS) return;
  polling = true;
  try {
    const needStats = Date.now() - lastStatsAt > 30_000;
    const [t, s] = await Promise.all([
      fetch(`${LIVE_REST_URL}/ticker`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      needStats ? fetch(`${LIVE_REST_URL}/stats`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null) : Promise.resolve(lastStats),
    ]);
    if (needStats && s) { lastStats = s; lastStatsAt = Date.now(); }
    // the stream may have come back while we were fetching; prefer it
    if (Date.now() - lastStreamMsg < LIVE_SILENT_AFTER_MS) return;
    const tick = parseCoinbaseRest(t, s);
    if (tick) {
      const cur = latest();
      pending = { ...tick, open24h: tick.open24h ?? cur?.open24h ?? null, high24h: tick.high24h ?? cur?.high24h ?? null, low24h: tick.low24h ?? cur?.low24h ?? null };
    }
  } catch {
    /* network error — next poll retries */
  } finally {
    polling = false;
  }
}

function start() {
  connect();
  void poll(); // first price right away, even before the stream connects
  pollTimer = setInterval(() => void poll(), LIVE_POLL_MS);
  flushTimer = setInterval(() => {
    if (pending) {
      snapshot = pending;
      pending = null;
    }
    // notify even without a new price so "x seconds ago" and stale checks keep moving
    if (snapshot) listeners.forEach((l) => l());
  }, LIVE_UPDATE_MS);
}

function stop() {
  if (flushTimer) clearInterval(flushTimer);
  if (pollTimer) clearInterval(pollTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  flushTimer = pollTimer = reconnectTimer = null;
  const s = ws;
  ws = null;
  s?.close();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) stop();
  };
}

export function useLiveTick() {
  return useSyncExternalStore(subscribe, () => snapshot, () => null);
}

/** Cached CoinGecko quote with the real-time Coinbase price layered on top when it is current. */
export function useXrpQuote() {
  const base = useQuery(quoteQuery());
  const tick = useLiveTick();
  const data = mergeLiveQuote(base.data, tick);
  return { data, isLoading: base.isLoading && !data, isError: base.isError && !data };
}
