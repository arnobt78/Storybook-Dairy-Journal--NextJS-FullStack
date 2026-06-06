"use client";

/**
 * SSE subscription — invalidates journalSubtree when another tab/device mutates data.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { notifyJournalCacheUpdated } from "@/lib/journal-cache-notify";
import { appToast } from "@/lib/app-toast";

const RECONNECT_MS = 3000;
const MAX_RECONNECT_MS = 30000;

export function useJournalRealtime() {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const esRef = useRef<EventSource | null>(null);
  const backoffRef = useRef(RECONNECT_MS);
  const lastToastRef = useRef(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      esRef.current?.close();

      const es = new EventSource("/api/journal/events");
      esRef.current = es;

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as { type?: string; heartbeat?: boolean };
          if (data.heartbeat) return;
          notifyJournalCacheUpdated(queryClient);
          const now = Date.now();
          if (now - lastToastRef.current > 4000) {
            lastToastRef.current = now;
            appToast.sync.refreshed();
          }
        } catch {
          /* ignore */
        }
      };

      es.onerror = () => {
        es.close();
        if (cancelled) return;
        reconnectTimer = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 1.5, MAX_RECONNECT_MS);
          connect();
        }, backoffRef.current);
      };

      es.onopen = () => {
        backoffRef.current = RECONNECT_MS;
      };
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") connect();
    };

    connect();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      esRef.current?.close();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status, queryClient]);
}
