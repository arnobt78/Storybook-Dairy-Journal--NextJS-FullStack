"use client";

/**
 * WALKTHROUGH — useAutoSave
 *
 * Lifecycle: mounts when BookSpread enters write mode (`enabled=true`).
 * Two effects cooperate:
 *   1) Baseline effect — snapshots `data` when editing starts so the first
 *      render does not trigger a spurious save.
 *   2) Debounce effect — serializes draft JSON; after `delay` ms (default 2s)
 *      fires PATCH or offline enqueue.
 *
 * Online path: fetch PATCH → invalidate `journalSubtree` → Sonner toast.
 * Offline path: `enqueuePatchEntryOffline` → optimistic cache + IndexedDB
 * sync queue → badge count via `refreshCount`.
 *
 * Refs (`timer`, `isSaving`, `previousData`) survive re-renders without
 * re-subscribing; cleanup clears pending timeout on unmount or deps change.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { appToast } from "@/lib/app-toast";
import { useOfflineSync } from "@/context/OfflineSyncContext";
import { queryKeys } from "@/lib/query-keys";
import {
  enqueuePatchEntryOffline,
  isBrowserOffline,
  isOfflineOrNetworkError,
} from "@/lib/offline/offline-journal-actions";
import type { UpdateEntryInput } from "@/lib/validations";

interface UseAutoSaveOptions {
  entryId: string;
  bookId: string;
  data: Record<string, unknown>;
  enabled: boolean;
  delay?: number;
  onSaveSuccess?: () => void;
}

/**
 * Debounced PATCH while editing; offline path applies optimistic cache + sync queue.
 */
export function useAutoSave({
  entryId,
  bookId,
  data,
  enabled,
  delay = 2000,
  onSaveSuccess,
}: UseAutoSaveOptions) {
  const queryClient = useQueryClient();
  const { refreshCount } = useOfflineSync();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSaving = useRef(false);
  const previousData = useRef<string>("");
  const wasEnabled = useRef(false);

  /* Effect 1 — establish baseline snapshot when write mode opens */
  useEffect(() => {
    if (enabled && entryId) {
      if (!wasEnabled.current) {
        previousData.current = JSON.stringify(data);
      }
    } else {
      previousData.current = "";
    }
    wasEnabled.current = enabled;
  }, [enabled, entryId, data]);

  /* Effect 2 — debounced save: online PATCH or offline queue + optimistic UI */
  useEffect(() => {
    if (!enabled || !entryId || !bookId) return;

    const serialized = JSON.stringify(data);
    if (serialized === previousData.current) return;

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      if (isSaving.current) return;
      isSaving.current = true;
      previousData.current = serialized;

      const payload = JSON.parse(serialized) as UpdateEntryInput;

      if (isBrowserOffline()) {
        try {
          await enqueuePatchEntryOffline({
            queryClient,
            bookId,
            entryId,
            payload,
            refreshPendingCount: refreshCount,
          });
          appToast.offline.queued("Changes");
          onSaveSuccess?.();
        } catch {
          appToast.journal.saveFailed("save offline");
        } finally {
          isSaving.current = false;
        }
        return;
      }

      try {
        const res = await fetch(`/api/entries/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });

        if (!res.ok) throw new Error("Save failed");

        void queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() });
        onSaveSuccess?.();

        appToast.journal.autosaved();
      } catch (err) {
        if (isOfflineOrNetworkError(err)) {
          try {
            await enqueuePatchEntryOffline({
              queryClient,
              bookId,
              entryId,
              payload,
              refreshPendingCount: refreshCount,
            });
            appToast.offline.queued("Changes");
            onSaveSuccess?.();
          } catch {
            appToast.journal.saveFailed("save offline");
          }
        } else {
          appToast.journal.saveFailed("save");
        }
      } finally {
        isSaving.current = false;
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [bookId, data, delay, enabled, entryId, onSaveSuccess, queryClient, refreshCount]);
}
