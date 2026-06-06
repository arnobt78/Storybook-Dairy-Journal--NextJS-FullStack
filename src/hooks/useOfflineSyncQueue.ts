"use client";

/**
 * WALKTHROUGH — useOfflineSyncQueue (sync queue drain)
 *
 * Mount lifecycle:
 *   1) Read pending count from IndexedDB `sync-queue` store.
 *   2) Subscribe to `window.online` + drain if already online.
 *
 * drainQueue():
 *   - FIFO pass over queued items (patchEntry, postEntry, patchBook, postBook).
 *   - Temp ids (`offline-*`) defer PATCH until post* remaps via `idRemapRef`.
 *   - Success → removeSyncItem; conflict/4xx → drop + toast.
 *   - After any sync → `notifyJournalCacheUpdated` refetches journalSubtree.
 *
 * Returns `{ pendingCount, drainQueue, refreshCount }` for context + badge.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { appToast } from "@/lib/app-toast";
import {
  dispatchOfflineBookSynced,
  dispatchOfflineEntrySynced,
  isOfflineTempBookId,
  isOfflineTempEntryId,
} from "@/constants/offline";
import {
  createJournalBook,
  createJournalEntry,
  updateJournalBook,
  updateJournalEntry,
} from "@/lib/journal-api";
import {
  replaceOptimisticBookId,
  replaceOptimisticEntryId,
} from "@/lib/journal-cache-optimistic";
import { notifyJournalCacheUpdated } from "@/lib/journal-cache-notify";
import {
  listSyncQueue,
  removeSyncItem,
  syncQueueCount,
  type SyncQueueItem,
} from "@/lib/offline/sync-queue-store";

type ProcessResult = "ok" | "defer" | "drop";

/**
 * Drains IndexedDB sync queue on `online`.
 * Remaps offline temp ids before PATCH; dispatches browser events for focus preservation.
 */
export function useOfflineSyncQueue() {
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const drainingRef = useRef(false);
  const idRemapRef = useRef(new Map<string, string>());

  /* Re-read queue length for DashboardNav badge */
  const updatePendingCount = useCallback(async () => {
    try {
      setPendingCount(await syncQueueCount());
    } catch {
      setPendingCount(0);
    }
  }, []);

  /* Map offline temp id → server cuid after postEntry/postBook succeeds */
  const resolveId = useCallback((id: string): string | null => {
    if (isOfflineTempEntryId(id) || isOfflineTempBookId(id)) {
      return idRemapRef.current.get(id) ?? null;
    }
    return id;
  }, []);

  const processItem = useCallback(
    async (item: SyncQueueItem): Promise<ProcessResult> => {
      try {
        /* Replay one queued mutation; remap temp ids before PATCH */
        switch (item.type) {
          case "patchEntry": {
            const entryId = resolveId(item.entryId);
            if (!entryId) return "defer";
            await updateJournalEntry(entryId, item.payload);
            break;
          }
          case "postEntry": {
            const created = await createJournalEntry(item.payload);
            if (item.clientTempId) {
              idRemapRef.current.set(item.clientTempId, created.id);
              replaceOptimisticEntryId(
                queryClient,
                item.payload.bookId,
                item.clientTempId,
                created.id,
              );
              dispatchOfflineEntrySynced({
                bookId: item.payload.bookId,
                tempEntryId: item.clientTempId,
                realEntryId: created.id,
              });
            }
            break;
          }
          case "patchBook": {
            const bookId = resolveId(item.bookId);
            if (!bookId) return "defer";
            await updateJournalBook(bookId, item.payload);
            break;
          }
          case "postBook": {
            const created = await createJournalBook(item.payload);
            if (item.clientTempBookId) {
              idRemapRef.current.set(item.clientTempBookId, created.id);
              replaceOptimisticBookId(queryClient, item.clientTempBookId, created.id);
              dispatchOfflineBookSynced({
                tempBookId: item.clientTempBookId,
                realBookId: created.id,
              });
            }
            break;
          }
        }
        await removeSyncItem(item.id);
        return "ok";
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sync failed";
        if (message.includes("409") || message.toLowerCase().includes("conflict")) {
          await removeSyncItem(item.id);
          appToast.offline.conflictDiscarded();
          return "drop";
        }
        if (/failed|4\d\d/i.test(message)) {
          await removeSyncItem(item.id);
          appToast.offline.syncFailed(message);
          return "drop";
        }
        throw err;
      }
    },
    [queryClient, resolveId],
  );

  /* Multi-pass drain: defer PATCH on temp ids until CREATE remaps them */
  const drainQueue = useCallback(async () => {
    if (drainingRef.current || typeof navigator === "undefined" || !navigator.onLine) {
      return;
    }
    drainingRef.current = true;
    try {
      let items = await listSyncQueue();
      if (items.length === 0) return;

      let synced = 0;
      let deferrals = 0;
      const maxPasses = items.length * 2;

      while (items.length > 0 && deferrals < maxPasses) {
        let progressed = false;
        for (const item of items) {
          const result = await processItem(item);
          if (result === "ok") {
            synced += 1;
            progressed = true;
          } else if (result === "defer") {
            deferrals += 1;
          }
        }
        if (!progressed) break;
        items = await listSyncQueue();
      }

      if (synced > 0) {
        notifyJournalCacheUpdated(queryClient);
        appToast.offline.syncComplete(synced);
      }
    } catch {
      /* network still flaky — retry on next online event */
    } finally {
      drainingRef.current = false;
      await updatePendingCount();
    }
  }, [processItem, queryClient, updatePendingCount]);

  /* Mount: initial count + online listener triggers drain */
  useEffect(() => {
    let active = true;

    void syncQueueCount()
      .then((count) => {
        if (active) setPendingCount(count);
      })
      .catch(() => {
        if (active) setPendingCount(0);
      });

    const onOnline = () => {
      idRemapRef.current.clear();
      void drainQueue();
    };
    window.addEventListener("online", onOnline);
    if (navigator.onLine) void drainQueue();

    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
    };
  }, [drainQueue]);

  return { pendingCount, drainQueue, refreshCount: updatePendingCount };
}
