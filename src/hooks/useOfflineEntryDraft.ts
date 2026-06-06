"use client";

/**
 * WALKTHROUGH — useOfflineEntryDraft
 *
 * IndexedDB draft persistence while editing (survives refresh/tab close).
 * Three-effect lifecycle:
 *   1) Debounced put — writes draft to IDB every 500ms while `enabled`.
 *   2) Restore — on write-mode open, compares local `updatedAt` vs server
 *      `entryUpdatedAt`; newer local wins → `onRestore` + toast.
 *   3) Guard reset — clears `restoredRef` when leaving write mode so the
 *      next open can restore again.
 *
 * Key format: `${bookId}:${entryId}` via `draftKey()`.
 */
import { useEffect, useRef } from "react";
import { appToast } from "@/lib/app-toast";
import {
  clearEntryDraft,
  draftKey,
  getEntryDraft,
  putEntryDraft,
} from "@/lib/offline/entry-draft-store";
import type { EntryDraft } from "@/types";

interface UseOfflineEntryDraftOptions {
  bookId: string;
  entryId: string;
  draft: EntryDraft;
  enabled: boolean;
  entryUpdatedAt?: string;
  onRestore: (draft: EntryDraft) => void;
  onClear?: () => void;
}

/**
 * Persists entry drafts to IndexedDB while editing; restores newer local drafts on write-mode open.
 */
export function useOfflineEntryDraft({
  bookId,
  entryId,
  draft,
  enabled,
  entryUpdatedAt,
  onRestore,
  onClear,
}: UseOfflineEntryDraftOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef<string | null>(null);

  /* Debounced write while editing */
  useEffect(() => {
    if (!enabled || !bookId || !entryId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void putEntryDraft(draftKey(bookId, entryId), {
        draft,
        updatedAt: Date.now(),
        entryUpdatedAt,
      });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [bookId, draft, enabled, entryId, entryUpdatedAt]);

  /* Restore local draft when entering write mode */
  useEffect(() => {
    if (!enabled || !bookId || !entryId) return;
    const key = `${bookId}:${entryId}`;
    if (restoredRef.current === key) return;

    void (async () => {
      try {
        const stored = await getEntryDraft(draftKey(bookId, entryId));
        if (!stored) return;

        const serverTime = entryUpdatedAt
          ? new Date(entryUpdatedAt).getTime()
          : 0;
        if (stored.updatedAt > serverTime) {
          onRestore(stored.draft);
          appToast.journal.draftRestored();
        }
        restoredRef.current = key;
      } catch {
        /* IDB unavailable — skip silently */
      }
    })();
  }, [bookId, enabled, entryId, entryUpdatedAt, onRestore]);

  /* Reset restore guard when leaving write mode */
  useEffect(() => {
    if (!enabled) restoredRef.current = null;
  }, [enabled]);

  return {
    clearLocalDraft: async () => {
      if (!bookId || !entryId) return;
      try {
        await clearEntryDraft(draftKey(bookId, entryId));
        onClear?.();
      } catch {
        /* ignore */
      }
    },
  };
}
