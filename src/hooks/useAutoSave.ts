"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

interface UseAutoSaveOptions {
  entryId: string;
  /** Optional book scope: included in effect deps so switching books resets the debounce timer. */
  bookId?: string;
  data: Record<string, unknown>;
  enabled: boolean;
  delay?: number;
}

/**
 * Debounced PATCH to `/api/entries/[entryId]`; on success invalidates the shared
 * `journalSubtree` cache so shelf + reader views refetch without navigation.
 * Baseline snapshot on write-mode open avoids PATCH when the draft is unchanged.
 */
export function useAutoSave({
  entryId,
  bookId: _bookId,
  data,
  enabled,
  delay = 2000,
}: UseAutoSaveOptions) {
  const queryClient = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSaving = useRef(false);
  const previousData = useRef<string>("");
  const wasEnabled = useRef(false);

  /* Seed baseline when edit mode opens so opening write mode does not trigger a noop PATCH. */
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

  useEffect(() => {
    if (!enabled || !entryId) return;

    const serialized = JSON.stringify(data);
    if (serialized === previousData.current) return;

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      if (isSaving.current) return;
      isSaving.current = true;
      previousData.current = serialized;

      try {
        const res = await fetch(`/api/entries/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });

        if (!res.ok) throw new Error("Save failed");

        void queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() });

        toast.success("Saved", {
          duration: 1200,
          style: { fontSize: "11px" },
        });
      } catch {
        toast.error("Failed to save — will retry");
      } finally {
        isSaving.current = false;
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, enabled, entryId, delay, _bookId, queryClient]);
}
