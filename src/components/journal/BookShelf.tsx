"use client";

/**
 * BookShelf — dashboard grid of journal spines + create/edit journal modals.
 * POST / PATCH / DELETE all invalidate `journalSubtree` so shelf + reader stay in sync.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { JournalBook } from "@/types";
import { bookToFormValues, type BookFormValues } from "@/types/book-form";
import { queryKeys } from "@/lib/query-keys";
import {
  createJournalBook,
  deleteJournalBook,
  fetchJournalBooks,
  updateJournalBook,
} from "@/lib/journal-api";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { BookEditorModal } from "@/components/journal/BookEditorModal";

interface BookShelfProps {
  books: (JournalBook & { _count?: { entries: number } })[];
  userName: string;
}

export function BookShelf({ books: initialBooks, userName }: BookShelfProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: books = initialBooks } = useQuery({
    queryKey: queryKeys.booksList(),
    queryFn: fetchJournalBooks,
    initialData: initialBooks,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<
    (JournalBook & { _count?: { entries: number } }) | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<
    (JournalBook & { _count?: { entries: number } }) | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  /** Bumps when opening create modal so BookEditorModal remounts with a clean form */
  const [createSession, setCreateSession] = useState(0);

  const invalidateJournal = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() });
  };

  const handleCreate = async (values: BookFormValues) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await createJournalBook(values);
      await invalidateJournal();
      setShowCreate(false);
      toast.success("Journal created");
    } catch {
      toast.error("Failed to create journal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (values: BookFormValues) => {
    if (!editTarget || isSaving) return;
    setIsSaving(true);
    try {
      await updateJournalBook(editTarget.id, values);
      await invalidateJournal();
      setEditTarget(null);
      toast.success("Journal updated");
    } catch {
      toast.error("Failed to update journal");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteBook = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteJournalBook(deleteTarget.id);
      await invalidateJournal();
      toast.success("Journal removed");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to remove journal");
    } finally {
      setIsDeleting(false);
    }
  };

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  const editorOpen = showCreate || Boolean(editTarget);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "48px" }}>
        <p
          style={{
            fontFamily: "'IM Fell English',serif",
            fontSize: "13px",
            color: "rgba(255,170,70,.4)",
            letterSpacing: "3px",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {greeting}
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display',serif",
            fontStyle: "italic",
            fontSize: "38px",
            color: "rgba(255,205,130,.88)",
            margin: "6px 0 0",
            lineHeight: 1.1,
          }}
        >
          {userName}&rsquo;s Journals
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "32px",
          alignItems: "flex-end",
        }}
      >
        {books.map((book) => (
          <BookSpine
            key={book.id}
            book={book}
            onClick={() => router.push(`/journal/${book.id}`)}
            onEdit={() => setEditTarget(book)}
            onDelete={() => setDeleteTarget(book)}
          />
        ))}

        <div
          onClick={() => {
            setCreateSession((n) => n + 1);
            setShowCreate(true);
          }}
          style={{
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "220px",
              background: "rgba(255,255,255,.04)",
              border: "2px dashed rgba(255,160,60,.15)",
              borderRadius: "3px 8px 8px 3px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,160,60,.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,.04)";
            }}
          >
            <span style={{ fontSize: "24px", opacity: 0.3 }}>+</span>
          </div>
          <span
            style={{
              fontFamily: "'Lora',serif",
              fontSize: "10px",
              color: "rgba(255,170,70,.3)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            New Journal
          </span>
        </div>
      </div>

      {books.length > 0 && (
        <div style={{ marginTop: "60px", display: "flex", gap: "40px" }}>
          {[
            { label: "Journals", value: books.length },
            {
              label: "Entries",
              value: books.reduce((s, b) => s + (b._count?.entries ?? 0), 0),
            },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "32px",
                  color: "rgba(255,195,100,.7)",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "'Lora',serif",
                  fontSize: "11px",
                  color: "rgba(255,160,60,.35)",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <BookEditorModal
        key={editTarget?.id ?? `create-${createSession}`}
        open={editorOpen}
        mode={editTarget ? "edit" : "create"}
        initialValues={editTarget ? bookToFormValues(editTarget) : undefined}
        loading={isSaving}
        onClose={() => {
          if (isSaving) return;
          setShowCreate(false);
          setEditTarget(null);
        }}
        onSubmit={(values) => {
          if (editTarget) void handleEdit(values);
          else void handleCreate(values);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove this journal?"
        description={
          deleteTarget ? (
            <>
              &ldquo;{deleteTarget.title}&rdquo; and all{" "}
              {deleteTarget._count?.entries ?? 0} pages will be permanently deleted.
            </>
          ) : null
        }
        confirmLabel="Remove journal"
        loading={isDeleting}
        onConfirm={() => void confirmDeleteBook()}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />
    </div>
  );
}

function BookSpine({
  book,
  onClick,
  onEdit,
  onDelete,
}: {
  book: JournalBook & { _count?: { entries: number } };
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <button
        type="button"
        aria-label={`Edit ${book.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        style={{
          position: "absolute",
          top: "-6px",
          left: "-6px",
          zIndex: 2,
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          border: "1px solid rgba(255,160,60,.25)",
          background: "rgba(16,6,1,.88)",
          color: "rgba(255,200,120,.75)",
          fontSize: "10px",
          lineHeight: 1,
          cursor: "pointer",
          opacity: hovered ? 1 : 0,
          transition: "opacity .2s",
        }}
      >
        ✎
      </button>
      <button
        type="button"
        aria-label={`Remove ${book.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          position: "absolute",
          top: "-6px",
          right: "-6px",
          zIndex: 2,
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          border: "1px solid rgba(255,120,80,.25)",
          background: "rgba(16,6,1,.88)",
          color: "rgba(255,160,100,.7)",
          fontSize: "11px",
          lineHeight: 1,
          cursor: "pointer",
          opacity: hovered ? 1 : 0,
          transition: "opacity .2s",
        }}
      >
        ×
      </button>
      <div
        onClick={onClick}
        style={{
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "220px",
            position: "relative",
            background: `linear-gradient(155deg, color-mix(in srgb,${book.coverColor} 60%,#000) 0%, ${book.coverColor} 40%, color-mix(in srgb,${book.coverColor} 70%,#3d1a06) 100%)`,
            borderRadius: "3px 8px 8px 3px",
            boxShadow: hovered
              ? `-6px 0 20px rgba(0,0,0,.5), 12px 20px 50px rgba(0,0,0,.7), inset -3px 0 8px rgba(0,0,0,.3)`
              : `-4px 0 12px rgba(0,0,0,.4), 6px 8px 30px rgba(0,0,0,.6)`,
            transform: hovered
              ? "translateY(-10px) rotateY(-4deg)"
              : "translateY(0) rotateY(0)",
            transition: "all .3s cubic-bezier(.23,1,.32,1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "10px",
              background: "rgba(0,0,0,.3)",
              borderRadius: "3px 0 0 3px",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(160deg,transparent 0,transparent 6px,rgba(0,0,0,.03) 6px,rgba(0,0,0,.03) 7px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "10px 8px 10px 14px",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: "2px",
            }}
          />
          <span style={{ fontSize: "22px", zIndex: 1, marginBottom: "8px" }}>
            {book.coverEmoji}
          </span>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontStyle: "italic",
              fontSize: "12px",
              color: "rgba(255,220,160,.85)",
              textAlign: "center",
              padding: "0 10px",
              lineHeight: 1.3,
              zIndex: 1,
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
            }}
          >
            {book.title}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "12px",
              color: "rgba(255,200,130,.65)",
            }}
          >
            {book.title}
          </div>
          <div
            style={{
              fontFamily: "'Lora',serif",
              fontSize: "10px",
              color: "rgba(255,160,60,.3)",
              marginTop: "2px",
            }}
          >
            {book._count?.entries ?? 0} entries
          </div>
        </div>
      </div>
    </div>
  );
}
