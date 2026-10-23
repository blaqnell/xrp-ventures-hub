import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { LIVE_UPDATE_MS, LIVE_WS_URL, mergeLiveQuote, parseCoinbaseTicker, type LiveTick } from "./market";
import { quoteQuery } from "./market.functions";

/**
 * One shared WebSocket for the whole tab. Ticks can arrive many times per second;
 * subscribers are notified with the newest tick at most every LIVE_UPDATE_MS.
 */
let snapshot: LiveTick | null = null;
let pending: LiveTick | null = null;
const listeners = new Set<() => void>();
let ws: WebSocket | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let retries = 0;

function connect() {
  if (typeof WebSocket === "undefined") return;
  const sock = new WebSocket(LIVE_WS_URL);
  ws = sock;
  sock.onopen = () => {
    retries = 0;
    sock.send(JSON.stringify({ type: "subscribe", product_ids: ["XRP-USD"], channels: ["ticker"] }));
  };
  sock.onmessage = (e) => {
    try {
      const t = parseCoinbaseTicker(JSON.parse(String(e.data)));
      if (t) pending = t;
    } catch {
      /* ignore malformed frames */
    }
  };
  sock.onerror = () => sock.close();
  sock.onclose = () => {
    if (ws !== sock || listeners.size === 0) return;
    ws = null;
    reconnectTimer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** retries++));
  };
}

function start() {
  connect();
  flushTimer = setInterval(() => {
    if (pending) {
      snapshot = pending;
      pending = null;
      listeners.forEach((l) => l());
    } else if (snapshot) {
      // keep "x seconds ago" and stale checks moving even without new trades
      listeners.forEach((l) => l());
    }
  }, LIVE_UPDATE_MS);
}

function stop() {
  if (flushTimer) clearInterval(flushTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  flushTimer = reconnectTimer = null;
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
