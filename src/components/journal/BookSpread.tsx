"use client";

/**
 * BookSpread — the main reader/editor component.
 *
 * Architecture:
 *  • TanStack Query (`useQuery`) hydrates from SSR `initialBook` and keeps the
 *    cache fresh after mutations (invalidateQueries on save/new entry).
 *  • Books created via POST /api/books include a starter entry so `current` is never
 *    missing on first paint. Legacy books with zero entries show a one-tap seed UI.
 *  • `flipDir` is forwarded to RightPage so it can apply the correct CSS stagger
 *    class (`page-stagger-fwd` / `page-stagger-bwd`) after each flip completes.
 *  • Shelf shortcut in the bottom nav uses `/book-stack-1.svg` (fixed pixel size, no CLS).
 *
 * Book sizing: all page/spine widths driven by CSS vars (--page-w, --page-h)
 * defined in globals.css :root so the entire spread scales responsively.
 */
import type { ReactNode } from "react";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LeftPage } from "./LeftPage";
import { RightPage } from "./RightPage";
import { PageFlipOverlay } from "./PageFlip";
import { usePageFlip } from "@/hooks/usePageFlip";
import { formatEntryDate } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { fetchJournalBook } from "@/lib/journal-api";
import type { JournalBook, JournalEntry, EntryDraft } from "@/types";
import type { FlipDirection } from "@/types";

export interface BookSpreadProps {
  initialBook: JournalBook & { entries: JournalEntry[] };
}

export function BookSpread({ initialBook }: BookSpreadProps) {
  const bookId = initialBook.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: book } = useQuery({
    queryKey: queryKeys.bookDetail(bookId),
    queryFn: () => fetchJournalBook(bookId),
    initialData: initialBook,
  });

  const entries = book.entries;
  const bookTitle = book.title;
  const bookColor = book.coverColor;

  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(() => {
    const last =
      initialBook.entries[Math.max(0, initialBook.entries.length - 1)];
    return last?.id ?? null;
  });
  const [isWriting, setIsWriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
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
    try {
      const res = await fetch(`/api/entries/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, tags: draft.tags }),
      });
      if (!res.ok) throw new Error();
      setIsWriting(false);
      /* One subtree invalidation covers book JSON + shelf entry counts without extra round-trips */
      await queryClient.invalidateQueries({
        queryKey: queryKeys.journalSubtree(),
      });
      toast.success("Entry saved");
    } catch {
      toast.error("Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  };

  const newEntry = async () => {
    if (isFlipping || isWriting) return;
    const { entryDate, weekday } = formatEntryDate();
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          title: "New Entry",
          content: "",
          mood: "✨",
          weather: "☀️",
          tags: [],
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
    } catch {
      toast.error("Failed to create entry");
    }
  };

  /**
   * AI Assist — calls /api/ai/assist (server-side proxy) so the Anthropic key
   * stays in environment variables and never reaches the browser.
   */
  const aiAssist = async () => {
    if (isAiThinking || !draft.content.trim()) return;
    setIsAiThinking(true);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          mood: draft.mood,
        }),
      });
      const json = await res.json();
      if (json.text) {
        setDraft((d) => ({
          ...d,
          content:
            d.content +
            (d.content.endsWith("\n") ? "" : "\n\n") +
            json.text.trim(),
        }));
      }
    } catch {
      toast.error("AI assist unavailable");
    } finally {
      setIsAiThinking(false);
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
          <button
            type="button"
            onClick={() => void newEntry()}
            disabled={isFlipping || isWriting}
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
          </button>
        </div>
      </>
    );
  }

  if (!current) return null;

  return (
    <>
      {/* Book shadow on the 3-D row — avoids parent `filter` + preserve-3d shimmer (same rationale as `AuthBookShell`). */}
      <div style={{ position: "relative" }}>
        {/* Book spread — `pointer-events: none` on the 3-D flex row avoids an oversized
          axis-aligned hit box (full spread) stealing clicks; `LeftPage` / `RightPage`
          re-enable `auto` only on their inner content stacks. */}
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
          />

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
          <button
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
          </button>
        </div>

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
    <button
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
    </button>
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
