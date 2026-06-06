"use client";

/** Mounts SSE realtime listener for authenticated dashboard sessions. */
import { useJournalRealtime } from "@/hooks/useJournalRealtime";

export function JournalRealtimeBridge() {
  useJournalRealtime();
  return null;
}
