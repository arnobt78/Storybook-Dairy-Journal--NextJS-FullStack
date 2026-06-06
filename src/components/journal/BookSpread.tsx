"use client";

/**
 * BookSpread — the main reader/editor component.
 *
 * Architecture:
 *  • TanStack Query (`useQuery`) hydrates from SSR `initialBook` and keeps the
 *    cache fresh after mutations (invalidateQueries on save/new entry).
 *  • DELETE entry/book via shared ConfirmDialog + journal-api helpers;
 *    journalSubtree invalidation keeps shelf + reader in sync without reload.
 *  • PATCH book metadata via BookEditorModal (shelf ✎ or reader “Edit journal”).
 *  • Books created via POST /api/books include a starter entry so `current` is never
 *    missing on first paint. Legacy books with zero entries show a one-tap seed UI.
 *  • `flipDir` is forwarded to RightPage so it can apply the correct CSS stagger
 *    class (`page-stagger-fwd` / `page-stagger-bwd`) after each flip completes.
 *  • Shelf shortcut in the bottom nav uses `/book-stack-1.svg` (fixed pixel size, no CLS).
 *
 * Book sizing: all page/spine widths driven by CSS vars (--page-w, --page-h)
 * defined in globals.css :root so the entire spread scales responsively.
 *
 * ── WALKTHROUGH: subsystems wired in this orchestrator ──
 *  PAGE FLIP — `usePageFlip()` owns `isFlipping` + `flipDir`. `navigate()` calls
 *    `triggerFlip(dir, onComplete)`; only after the animation callback runs do we
 *    swap `focusedEntryId`. `PageFlipOverlay` mounts as a sibling inside the 3-D row.
 *  AUTOSAVE — `useAutoSave` debounces PATCH to `/api/entries/:id` while `isWriting`.
 *    Paused during explicit Save (`isSaving`) or read mode. Clears IndexedDB draft on success.
 *  OFFLINE — `useOfflineEntryDraft` mirrors draft to IndexedDB; saves call
 *    `enqueuePatchEntryOffline` / `enqueuePostEntryOffline` when offline or on network error.
 *    `useOfflineIdRemap` swaps temp cuid ids after sync drain.
 *  3D BOOK — flex row uses `transformStyle: preserve-3d` + mild perspective tilt;
 *    page shells set `pointerEvents: none` with inner stacks at `auto` (see Left/RightPage).
 */
import type { ReactNode } from "react";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { appToast } from "@/lib/app-toast";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { BookEditorModal } from "@/components/journal/BookEditorModal";
import { LeftPage } from "./LeftPage";
import { RightPage } from "./RightPage";
import { PageFlipOverlay } from "./PageFlip";
import { usePageFlip } from "@/hooks/usePageFlip";
import { useBookTheme } from "@/hooks/useBookTheme";
import { RippleButton } from "@/components/ui/ripple-button";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useOfflineEntryDraft } from "@/hooks/useOfflineEntryDraft";
import { useOfflineIdRemap } from "@/hooks/useOfflineIdRemap";
import { useOfflineSync } from "@/context/OfflineSyncContext";
import { createAiAssistSessionId } from "@/lib/ai-assist";
import { formatEntryDate } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { fetchJournalBook, deleteJournalBook, deleteJournalEntry, updateJournalBook } from "@/lib/journal-api";
import {
  enqueuePatchBookOffline,
  enqueuePatchEntryOffline,
  enqueuePostEntryOffline,
  isBrowserOffline,
  isOfflineOrNetworkError,
} from "@/lib/offline/offline-journal-actions";
import type { JournalBook, JournalEntry, EntryDraft } from "@/types";
import { bookToFormValues, type BookFormValues } from "@/types/book-form";
import type { FlipDirection } from "@/types";

export interface BookSpreadProps {
  initialBook: JournalBook & { entries: JournalEntry[] };
}

export function BookSpread({ initialBook }: BookSpreadProps) {
  const bookId = initialBook.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshCount } = useOfflineSync();

  const { data: book } = useQuery({
    queryKey: queryKeys.bookDetail(bookId),
    queryFn: () => fetchJournalBook(bookId),
    initialData: initialBook,
  });

  const entries = book.entries;
  const bookTitle = book.title;
  const bookColor = book.coverColor;
  const bookThemeProps = useBookTheme(book.theme ?? "warm-paper");

  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(() => {
    const last =
      initialBook.entries[Math.max(0, initialBook.entries.length - 1)];
    return last?.id ?? null;
  });
  const [isWriting, setIsWriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState(false);
  const [confirmDeleteBook, setConfirmDeleteBook] = useState(false);
  const [showEditBook, setShowEditBook] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [draft, setDraft] = useState<EntryDraft>({
    title: "",
    content: "",
    mood: "✨",
    weather: "☀️",
    tags: [],
    location: "",
  });

  /* Track last flip direction so RightPage can apply the correct stagger class */
  const [lastFlipDir, setLastFlipDir] = useState<FlipDirection | null>(null);
  const { isFlipping, flipDir, triggerFlip } = usePageFlip();

  const remapFocusedEntry = useCallback((realEntryId: string) => {
    setFocusedEntryId(realEntryId);
  }, []);

  /* ── OFFLINE: temp entry ids from queue remap to server ids after sync ── */
  useOfflineIdRemap({
    bookId,
    focusedEntryId,
    onEntryIdRemap: remapFocusedEntry,
  });

  const currentIdx = useMemo(() => {
    if (!entries.length) return 0;
    if (focusedEntryId) {
      const i = entries.findIndex((e) => e.id === focusedEntryId);
      if (i >= 0) return i;
    }
    return Math.max(0, entries.length - 1);
  }, [entries, focusedEntryId]);

  const current = entries[currentIdx];
  const prev = currentIdx > 0 ? entries[currentIdx - 1] : null;

  const autoSavePayload = useMemo(
    () => ({ ...draft, tags: draft.tags }),
    [draft],
  );

  /* ── OFFLINE + AUTOSAVE: IndexedDB draft backup while editing (survives refresh/tab crash) ── */
  const { clearLocalDraft } = useOfflineEntryDraft({
    bookId,
    entryId: current?.id ?? "",
    draft,
    enabled: isWriting && Boolean(current?.id),
    entryUpdatedAt: current?.updatedAt
      ? new Date(current.updatedAt).toISOString()
      : undefined,
    onRestore: (restored) => setDraft(restored),
  });

  /* Debounced PATCH while editing — pauses during explicit save or when not in write mode */
  /* ── AUTOSAVE: see useAutoSave hook — debounced PATCH while isWriting ── */
  useAutoSave({
    entryId: current?.id ?? "",
    bookId,
    data: autoSavePayload,
    enabled: isWriting && !isSaving && Boolean(current?.id),
    onSaveSuccess: () => {
      void clearLocalDraft();
    },
  });

  /* ── PAGE FLIP: flip animation first, then swap focused entry in onComplete ── */
  const navigate = useCallback(
    (targetIdx: number) => {
      if (targetIdx === currentIdx || isFlipping || isWriting) return;
      const nextId = entries[targetIdx]?.id;
      if (!nextId) return;
      const dir: FlipDirection = targetIdx > currentIdx ? "fwd" : "bwd";
      triggerFlip(dir, () => {
        setFocusedEntryId(nextId);
        setLastFlipDir(dir);
      });
    },
    [currentIdx, entries, isFlipping, isWriting, triggerFlip],
  );

  const goNext = () => navigate(currentIdx + 1);
  const goPrev = () => navigate(currentIdx - 1);

  const startWriting = () => {
    if (!current) return;
    setDraft({
      title: current.title,
      content: current.content,
      mood: current.mood,
      weather: current.weather,
      tags: [...current.tags],
      location: current.location ?? "",
    });
    setIsWriting(true);
  };

  const handleDraftChange = (
    field: keyof EntryDraft,
    value: string | string[],
  ) => {
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const saveEntry = async () => {
    if (!current || isSaving) return;
    setIsSaving(true);
    const payload = {
      title: draft.title,
      content: draft.content,
      mood: draft.mood,
      weather: draft.weather,
      tags: draft.tags,
      ...(draft.location ? { location: draft.location } : {}),
    };

    if (isBrowserOffline()) {
      try {
        /* ── OFFLINE: queue PATCH + optimistic cache; toast instead of API ── */
        await enqueuePatchEntryOffline({
          queryClient,
          bookId,
          entryId: current.id,
          payload,
          refreshPendingCount: refreshCount,
        });
        setIsWriting(false);
        appToast.offline.queued("Entry");
      } catch {
        appToast.journal.saveFailed("save offline");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      const res = await fetch(`/api/entries/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setIsWriting(false);
      await clearLocalDraft();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.journalSubtree(),
      });
      appToast.journal.entrySaved();
    } catch (err) {
      if (isOfflineOrNetworkError(err)) {
        try {
          await enqueuePatchEntryOffline({
            queryClient,
            bookId,
            entryId: current.id,
            payload,
            refreshPendingCount: refreshCount,
          });
          setIsWriting(false);
          appToast.offline.queued("Entry");
        } catch {
          appToast.journal.saveFailed("save offline");
        }
      } else {
        appToast.journal.saveFailed("save entry");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const newEntry = async () => {
    if (isFlipping || isWriting) return;
    const { entryDate, weekday } = formatEntryDate();
    const createPayload = {
      bookId,
      title: "New Entry",
      content: "",
      mood: "✨",
      weather: "☀️",
      tags: [] as string[],
    };

    if (isBrowserOffline()) {
      try {
        const tempId = await enqueuePostEntryOffline({
          queryClient,
          bookId,
          payload: createPayload,
          refreshPendingCount: refreshCount,
        });
        triggerFlip("fwd", () => {
          setFocusedEntryId(tempId);
          setLastFlipDir("fwd");
          setDraft({
            title: "New Entry",
            content: "",
            mood: "✨",
            weather: "☀️",
            tags: [],
            location: "",
          });
          setIsWriting(true);
        });
        appToast.offline.queued("New page");
      } catch {
        appToast.journal.saveFailed("queue new page offline");
      }
      return;
    }

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createPayload,
          entryDate,
          weekday,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.journalSubtree(),
      });
      const fresh = await queryClient.fetchQuery({
        queryKey: queryKeys.bookDetail(bookId),
        queryFn: () => fetchJournalBook(bookId),
      });
      const last = fresh.entries[fresh.entries.length - 1];
      const newId = last?.id;
      if (!newId) throw new Error();
      triggerFlip("fwd", () => {
        setFocusedEntryId(newId);
        setLastFlipDir("fwd");
        setDraft({
          title: "New Entry",
          content: "",
          mood: "✨",
          weather: "☀️",
          tags: [],
          location: "",
        });
        setIsWriting(true);
      });
    } catch (err) {
      if (isOfflineOrNetworkError(err)) {
        try {
          const tempId = await enqueuePostEntryOffline({
            queryClient,
            bookId,
            payload: createPayload,
            refreshPendingCount: refreshCount,
          });
          triggerFlip("fwd", () => {
            setFocusedEntryId(tempId);
            setLastFlipDir("fwd");
            setDraft({
              title: "New Entry",
              content: "",
              mood: "✨",
              weather: "☀️",
              tags: [],
              location: "",
            });
            setIsWriting(true);
          });
          appToast.offline.queued("New page");
        } catch {
          appToast.journal.saveFailed("queue new page offline");
        }
      } else {
        appToast.journal.saveFailed("create entry");
      }
    }
  };

  /**
   * AI Assist — prefers SSE stream; falls back to sync POST on failure.
   */
  const aiAssist = async () => {
    if (isAiThinking || !draft.content.trim()) return;
    setIsAiThinking(true);
    const assistSessionId = createAiAssistSessionId();

    const body = JSON.stringify({
      title: draft.title,
      content: draft.content,
      mood: draft.mood,
      assistSessionId,
    });

    try {
      const streamRes = await fetch("/api/ai/assist/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (streamRes.status === 429) {
        const errJson = (await streamRes.json()) as { error?: string };
        appToast.ai.rateLimited(60);
        return;
      }

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let prefixAdded = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data: ")) continue;
            const json = JSON.parse(line.slice(6)) as {
              text?: string;
              error?: string;
              done?: string;
              usedFallback?: boolean;
            };
            if (json.usedFallback) appToast.ai.fallbackOpenRouter();
            if (json.error) throw new Error(json.error);
            if (json.text) {
              setDraft((d) => {
                const sep =
                  !prefixAdded && d.content && !d.content.endsWith("\n")
                    ? "\n\n"
                    : "";
                prefixAdded = true;
                return { ...d, content: d.content + sep + json.text };
              });
            }
          }
        }
        return;
      }

      /* Fallback to sync route */
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (json.error) throw new Error(json.error);
      if (json.text) {
        setDraft((d) => ({
          ...d,
          content:
            d.content +
            (d.content.endsWith("\n") ? "" : "\n\n") +
            json.text!.trim(),
        }));
      }
    } catch {
      appToast.ai.unavailable();
    } finally {
      setIsAiThinking(false);
    }
  };

  /** DELETE current entry — refetch book cache and focus an adjacent page */
  const handleDeleteEntry = async () => {
    if (!current || isDeleting || isWriting || isFlipping) return;
    setIsDeleting(true);
    try {
      await deleteJournalEntry(current.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() });
      const fresh = await queryClient.fetchQuery({
        queryKey: queryKeys.bookDetail(bookId),
        queryFn: () => fetchJournalBook(bookId),
      });
      setIsWriting(false);
      if (fresh.entries.length === 0) {
        setFocusedEntryId(null);
      } else {
        const nextIdx = Math.min(currentIdx, fresh.entries.length - 1);
        setFocusedEntryId(fresh.entries[nextIdx]?.id ?? null);
      }
      appToast.journal.entryRemoved();
    } catch {
      appToast.journal.saveFailed("remove page");
    } finally {
      setIsDeleting(false);
      setConfirmDeleteEntry(false);
    }
  };

  /** DELETE entire journal — redirect to shelf after subtree invalidation */
  const handleDeleteBook = async () => {
    if (isDeleting || isFlipping) return;
    setIsDeleting(true);
    try {
      await deleteJournalBook(bookId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() });
      appToast.journal.bookRemoved();
      router.push("/dashboard");
      router.refresh();
    } catch {
      appToast.journal.saveFailed("remove journal");
    } finally {
      setIsDeleting(false);
      setConfirmDeleteBook(false);
    }
  };

  /** PATCH journal metadata — optimistic + offline queue when network unavailable */
  const handleUpdateBook = async (values: BookFormValues) => {
    if (isSavingBook || isFlipping) return;
    setIsSavingBook(true);
    try {
      if (isBrowserOffline()) {
        await enqueuePatchBookOffline({
          queryClient,
          bookId,
          payload: values,
          refreshPendingCount: refreshCount,
        });
        setShowEditBook(false);
        appToast.offline.queued("Journal");
        return;
      }

      await updateJournalBook(bookId, values);
      await queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() });
      setShowEditBook(false);
      appToast.journal.bookUpdated();
    } catch (err) {
      if (isOfflineOrNetworkError(err)) {
        try {
          await enqueuePatchBookOffline({
            queryClient,
            bookId,
            payload: values,
            refreshPendingCount: refreshCount,
          });
          setShowEditBook(false);
          appToast.offline.queued("Journal");
        } catch {
          appToast.journal.saveFailed("save journal offline");
        }
      } else {
        appToast.journal.saveFailed("update journal");
      }
    } finally {
      setIsSavingBook(false);
    }
  };

  if (!entries.length) {
    return (
      <>
        {/* Legacy or migrated books with no rows: `BookSpread` needs a `current` entry. */}
        <div
          style={{
            position: "relative",
            maxWidth: "min(380px, 92vw)",
            padding: "36px 28px",
            textAlign: "center",
            borderRadius: "12px",
            border: "1px solid rgba(255,160,60,.12)",
            background: "rgba(16,6,1,.35)",
            boxShadow: "0 24px 48px rgba(0,0,0,.4)",
          }}
        >
          <p
            style={{
              fontFamily: "'Lora',serif",
              fontSize: "14px",
              lineHeight: 1.65,
              color: "rgba(255,200,140,.62)",
              margin: "0 0 22px",
            }}
          >
            This journal has no pages yet. Create the first entry to open the
            book.
          </p>
          <RippleButton
            type="button"
            onClick={() => void newEntry()}
            disabled={isFlipping || isWriting}
            shine
            style={{
              fontFamily: "'Lora',serif",
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "rgba(160,85,30,.28)",
              color: "rgba(255,205,130,.88)",
              border: "1px solid rgba(160,85,30,.35)",
              padding: "10px 22px",
              borderRadius: "24px",
              cursor: isFlipping || isWriting ? "default" : "pointer",
              opacity: isFlipping || isWriting ? 0.45 : 1,
            }}
          >
            + First page
          </RippleButton>
          <RippleButton
            type="button"
            onClick={() => setShowEditBook(true)}
            disabled={isFlipping || isWriting || isSavingBook}
            style={{
              display: "block",
              margin: "12px auto 0",
              fontFamily: "'Lora',serif",
              fontSize: "10px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: "rgba(160,85,30,.22)",
              color: "rgba(255,185,100,.65)",
              border: "1px solid rgba(160,85,30,.28)",
              padding: "8px 16px",
              borderRadius: "20px",
              cursor: "pointer",
              opacity: isFlipping || isWriting || isSavingBook ? 0.45 : 1,
            }}
          >
            Edit journal
          </RippleButton>
          <RippleButton
            type="button"
            onClick={() => setConfirmDeleteBook(true)}
            disabled={isFlipping || isWriting || isDeleting}
            style={{
              display: "block",
              margin: "16px auto 0",
              fontFamily: "'Lora',serif",
              fontSize: "10px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: "transparent",
              color: "rgba(255,160,100,.4)",
              border: "1px solid rgba(255,160,60,.15)",
              padding: "8px 16px",
              borderRadius: "20px",
              cursor: "pointer",
              opacity: isFlipping || isWriting || isDeleting ? 0.45 : 1,
            }}
          >
            Remove journal
          </RippleButton>
        </div>
        <BookEditorModal
          key={`edit-${bookId}-${showEditBook}`}
          open={showEditBook}
          mode="edit"
          initialValues={bookToFormValues(book)}
          loading={isSavingBook}
          onClose={() => !isSavingBook && setShowEditBook(false)}
          onSubmit={(values) => void handleUpdateBook(values)}
        />
        <ConfirmDialog
          open={confirmDeleteBook}
          variant="dark"
          title="Remove this journal?"
          description={<>Every page in &ldquo;{bookTitle}&rdquo; will be permanently deleted.</>}
          confirmLabel="Remove journal"
          loading={isDeleting}
          onConfirm={() => void handleDeleteBook()}
          onCancel={() => setConfirmDeleteBook(false)}
        />
      </>
    );
  }

  if (!current) return null;

  return (
    <>
      {/* Book shadow on the 3-D row — avoids parent `filter` + preserve-3d shimmer (same rationale as `AuthBookShell`). */}
      <div
        style={{ position: "relative", ...bookThemeProps.style }}
        data-book-theme={bookThemeProps["data-book-theme"]}
      >
        {/* Book spread — `pointer-events: none` on the 3-D flex row avoids an oversized
          axis-aligned hit box (full spread) stealing clicks; `LeftPage` / `RightPage`
          re-enable `auto` only on their inner content stacks. */}
        {/* ── 3D BOOK: preserve-3d spread — shadow on wrapper, not filter (avoids shimmer) ── */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            transformStyle: "preserve-3d",
            transform: "perspective(2000px) rotateX(3deg) rotateY(-2deg)",
            position: "relative",
            pointerEvents: "none",
            boxShadow:
              "0 48px 96px rgba(0,0,0,.72), 0 16px 40px rgba(0,0,0,.38)",
          }}
        >
          {/* Spine */}
          <div
            style={{
              width: "var(--spine-w, 22px)",
              flexShrink: 0,
              zIndex: 10,
              background: `linear-gradient(180deg,
            color-mix(in srgb,${bookColor} 30%,#000) 0%,
            ${bookColor} 50%,
            color-mix(in srgb,${bookColor} 30%,#000) 100%)`,
              boxShadow: "inset -2px 0 5px rgba(0,0,0,.4)",
            }}
          />

          <LeftPage
            currentEntry={current}
            prevEntry={prev}
            entries={entries}
            currentIdx={currentIdx}
            pageNumber={currentIdx * 2 + 1}
            onNavigate={navigate}
          />

          <RightPage
            entry={current}
            pageNumber={currentIdx * 2 + 2}
            isWriting={isWriting}
            draft={draft}
            isSaving={isSaving}
            flipDir={lastFlipDir}
            isFlipping={isFlipping}
            onStartWriting={startWriting}
            onDraftChange={handleDraftChange}
            onSave={saveEntry}
            onCancel={() => setIsWriting(false)}
            onAiAssist={aiAssist}
            isAiThinking={isAiThinking}
            onDeleteEntry={() => setConfirmDeleteEntry(true)}
            canDeleteEntry={!isFlipping && !isWriting && !isDeleting}
          />

          {/* ── PAGE FLIP: overlay mounts only during animation ── */}
          {isFlipping && flipDir && <PageFlipOverlay direction={flipDir} />}
        </div>

        {/* Navigation bar */}
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "rgba(16,6,1,.9)",
            backdropFilter: "blur(10px)",
            padding: "10px 22px",
            borderRadius: "50px",
            border: "1px solid rgba(255,160,60,.08)",
            whiteSpace: "nowrap",
          }}
        >
          {/* Vector shelf icon: same-origin `/public` asset, `unoptimized` keeps SVG decode cheap. */}
          <NavBtn
            onClick={() => router.push("/dashboard")}
            title="Back to shelf"
          >
            <Image
              src="/book-stack-2.svg"
              alt=""
              width={24}
              height={24}
              unoptimized
              className="pointer-events-none block shrink-0 object-contain"
              style={{ width: 24, height: 24, opacity: 0.88 }}
            />
          </NavBtn>
          <Divider />
          <NavBtn
            onClick={goPrev}
            disabled={currentIdx === 0 || isFlipping || isWriting}
          >
            ←
          </NavBtn>
          <span
            style={{
              fontFamily: "'IM Fell English',serif",
              fontSize: "12px",
              color: "rgba(255,175,90,.45)",
              minWidth: "70px",
              textAlign: "center",
            }}
          >
            {currentIdx + 1} of {entries.length}
          </span>
          <NavBtn
            onClick={goNext}
            disabled={
              currentIdx === entries.length - 1 || isFlipping || isWriting
            }
          >
            →
          </NavBtn>
          <Divider />
          <RippleButton
            type="button"
            onClick={newEntry}
            disabled={isFlipping || isWriting}
            style={{
              fontFamily: "'Lora',serif",
              fontSize: "9.5px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "rgba(160,85,30,.22)",
              color: "rgba(255,185,100,.65)",
              border: "1px solid rgba(160,85,30,.28)",
              padding: "5px 15px",
              borderRadius: "20px",
              cursor: "pointer",
              opacity: isFlipping || isWriting ? 0.35 : 1,
              transition: "all .2s",
            }}
          >
            + New Entry
          </RippleButton>
          <Divider />
          <RippleButton
            type="button"
            onClick={() => setShowEditBook(true)}
            disabled={isFlipping || isWriting || isSavingBook || isDeleting}
            title="Edit journal"
            style={{
              fontFamily: "'Lora',serif",
              fontSize: "9px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: "rgba(160,85,30,.18)",
              color: "rgba(255,185,100,.6)",
              border: "1px solid rgba(160,85,30,.25)",
              padding: "5px 12px",
              borderRadius: "20px",
              cursor: "pointer",
              opacity: isFlipping || isWriting || isSavingBook || isDeleting ? 0.35 : 1,
            }}
          >
            Edit journal
          </RippleButton>
          <RippleButton
            type="button"
            onClick={() => setConfirmDeleteBook(true)}
            disabled={isFlipping || isWriting || isDeleting}
            title="Remove journal"
            style={{
              fontFamily: "'Lora',serif",
              fontSize: "9px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: "transparent",
              color: "rgba(255,140,90,.45)",
              border: "1px solid rgba(255,120,60,.15)",
              padding: "5px 12px",
              borderRadius: "20px",
              cursor: "pointer",
              opacity: isFlipping || isWriting || isDeleting ? 0.35 : 1,
            }}
          >
            Remove journal
          </RippleButton>
        </div>

        <BookEditorModal
          key={`edit-${bookId}-${showEditBook}`}
          open={showEditBook}
          mode="edit"
          initialValues={bookToFormValues(book)}
          loading={isSavingBook}
          onClose={() => !isSavingBook && setShowEditBook(false)}
          onSubmit={(values) => void handleUpdateBook(values)}
        />
        <ConfirmDialog
          open={confirmDeleteEntry}
          variant="dark"
          title="Remove this page?"
          description={
            <>
              &ldquo;{current.title}&rdquo; will be permanently deleted from this journal.
            </>
          }
          confirmLabel="Remove page"
          loading={isDeleting}
          onConfirm={() => void handleDeleteEntry()}
          onCancel={() => setConfirmDeleteEntry(false)}
        />
        <ConfirmDialog
          open={confirmDeleteBook}
          variant="dark"
          title="Remove this journal?"
          description={
            <>
              Every page in &ldquo;{bookTitle}&rdquo; will be permanently deleted.
            </>
          }
          confirmLabel="Remove journal"
          loading={isDeleting}
          onConfirm={() => void handleDeleteBook()}
          onCancel={() => setConfirmDeleteBook(false)}
        />

        {/* Book title label above spread */}
        <div
          style={{
            position: "absolute",
            top: "-42px",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'Playfair Display',serif",
            fontStyle: "italic",
            fontSize: "14px",
            color: "rgba(255,200,130,.45)",
            whiteSpace: "nowrap",
          }}
        >
          {bookTitle}
        </div>
      </div>
    </>
  );
}

function NavBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <RippleButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: "none",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        color: "rgba(255,175,90,.55)",
        fontSize: "15px",
        padding: "4px 8px",
        borderRadius: "8px",
        opacity: disabled ? 0.18 : 1,
        transition: "all .2s",
      }}
    >
      {children}
    </RippleButton>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: "1px",
        height: "14px",
        background: "rgba(255,160,60,.3)",
      }}
    />
  );
}
