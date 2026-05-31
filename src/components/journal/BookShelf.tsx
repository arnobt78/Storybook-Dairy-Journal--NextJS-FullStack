"use client";

/**
 * BookShelf — dashboard grid of journal spines + “New Journal” modal.
 * After POST /api/books, TanStack’s `journalSubtree` key refetches shelf stats and
 * any in-memory book payloads so other mounted routes stay in sync without reload.
 */
import type { CSSProperties } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { COVER_COLORS, COVER_EMOJIS } from "@/constants";
import type { JournalBook } from "@/types";
import { queryKeys } from "@/lib/query-keys";
import { fetchJournalBooks } from "@/lib/journal-api";

interface BookShelfProps {
  books: (JournalBook & { _count?: { entries: number } })[];
  userName: string;
}

/**
 * Dashboard shelf: hydrates from SSR `books` then keeps TanStack Query as the
 * source of truth so invalidateQueries from the journal reader refreshes counts
 * without a full navigation.
 */
export function BookShelf({ books: initialBooks, userName }: BookShelfProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: books = initialBooks } = useQuery({
    queryKey: queryKeys.booksList(),
    queryFn: fetchJournalBooks,
    initialData: initialBooks,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", coverColor: "#8b4513", coverEmoji: "📖" });

  const createBook = async () => {
    if (!form.title.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error();
      /* New spine on the shelf: subtree keys refetch counts everywhere journal data is mounted */
      await queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() });
      setShowCreate(false);
      setForm({ title: "", description: "", coverColor: "#8b4513", coverEmoji: "📖" });
      toast.success("Journal created");
    } catch {
      toast.error("Failed to create journal");
    } finally {
      setCreating(false);
    }
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <p style={{ fontFamily: "'IM Fell English',serif", fontSize: "13px", color: "rgba(255,170,70,.4)", letterSpacing: "3px", textTransform: "uppercase", margin: 0 }}>
          {greeting}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "38px", color: "rgba(255,205,130,.88)", margin: "6px 0 0", lineHeight: 1.1 }}>
          {userName}&rsquo;s Journals
        </h1>
      </div>

      {/* Shelf */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", alignItems: "flex-end" }}>
        {books.map(book => (
          <BookSpine
            key={book.id}
            book={book}
            onClick={() => router.push(`/journal/${book.id}`)}
          />
        ))}

        {/* Add new */}
        <div
          onClick={() => setShowCreate(true)}
          style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}
        >
          <div style={{
            width: "80px", height: "220px",
            background: "rgba(255,255,255,.04)",
            border: "2px dashed rgba(255,160,60,.15)",
            borderRadius: "3px 8px 8px 3px",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .25s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,160,60,.07)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.04)")}
          >
            <span style={{ fontSize: "24px", opacity: 0.3 }}>+</span>
          </div>
          <span style={{ fontFamily: "'Lora',serif", fontSize: "10px", color: "rgba(255,170,70,.3)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            New Journal
          </span>
        </div>
      </div>

      {/* Stats */}
      {books.length > 0 && (
        <div style={{ marginTop: "60px", display: "flex", gap: "40px" }}>
          {[
            { label: "Journals", value: books.length },
            { label: "Entries", value: books.reduce((s, b) => s + (b._count?.entries ?? 0), 0) },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "32px", color: "rgba(255,195,100,.7)" }}>{stat.value}</div>
              <div style={{ fontFamily: "'Lora',serif", fontSize: "11px", color: "rgba(255,160,60,.35)", letterSpacing: "2px", textTransform: "uppercase" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div style={{ background: "rgba(244,236,218,.97)", borderRadius: "8px", padding: "36px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,.6)" }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", color: "rgba(35,14,3,.85)", margin: "0 0 24px" }}>
              New Journal
            </h2>
            <label style={labelStyle}>Title</label>
            <input
              style={inputStyle}
              placeholder="My Journal"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && createBook()}
            />
            <label style={labelStyle}>Description (optional)</label>
            <input
              style={inputStyle}
              placeholder="A place for my thoughts…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <label style={labelStyle}>Cover Color</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {COVER_COLORS.map(c => (
                <div key={c.value} onClick={() => setForm(f => ({ ...f, coverColor: c.value }))}
                  style={{ width: "28px", height: "28px", borderRadius: "4px", background: c.value, cursor: "pointer", border: form.coverColor === c.value ? "3px solid rgba(35,14,3,.6)" : "3px solid transparent", transition: "border .15s" }} />
              ))}
            </div>
            <label style={labelStyle}>Cover Emoji</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "24px" }}>
              {COVER_EMOJIS.map(emoji => (
                <button key={emoji} type="button" onClick={() => setForm(f => ({ ...f, coverEmoji: emoji }))}
                  style={{ fontSize: "18px", background: form.coverEmoji === emoji ? "rgba(120,70,20,.12)" : "none", border: form.coverEmoji === emoji ? "1px solid rgba(120,70,20,.3)" : "1px solid transparent", borderRadius: "6px", padding: "3px 6px", cursor: "pointer" }}>
                  {emoji}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowCreate(false)}
                style={{ fontFamily: "'Lora',serif", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", background: "transparent", color: "rgba(100,55,20,.55)", border: "1px solid rgba(120,70,20,.22)", padding: "8px 18px", borderRadius: "3px", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={createBook} disabled={!form.title.trim() || creating}
                style={{ fontFamily: "'Lora',serif", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", background: "rgba(90,40,10,.82)", color: "rgba(255,215,150,.92)", border: "none", padding: "8px 20px", borderRadius: "3px", cursor: "pointer" }}>
                {creating ? "Creating…" : "Create Journal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookSpine({ book, onClick }: { book: JournalBook & { _count?: { entries: number } }; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div onClick={onClick} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: "80px", height: "220px", position: "relative",
          background: `linear-gradient(155deg, color-mix(in srgb,${book.coverColor} 60%,#000) 0%, ${book.coverColor} 40%, color-mix(in srgb,${book.coverColor} 70%,#3d1a06) 100%)`,
          borderRadius: "3px 8px 8px 3px",
          boxShadow: hovered
            ? `-6px 0 20px rgba(0,0,0,.5), 12px 20px 50px rgba(0,0,0,.7), inset -3px 0 8px rgba(0,0,0,.3)`
            : `-4px 0 12px rgba(0,0,0,.4), 6px 8px 30px rgba(0,0,0,.6)`,
          transform: hovered ? "translateY(-10px) rotateY(-4deg)" : "translateY(0) rotateY(0)",
          transition: "all .3s cubic-bezier(.23,1,.32,1)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Spine strip */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "10px", background: "rgba(0,0,0,.3)", borderRadius: "3px 0 0 3px" }} />
        {/* Texture */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(160deg,transparent 0,transparent 6px,rgba(0,0,0,.03) 6px,rgba(0,0,0,.03) 7px)" }} />
        {/* Border */}
        <div style={{ position: "absolute", inset: "10px 8px 10px 14px", border: "1px solid rgba(255,255,255,.1)", borderRadius: "2px" }} />
        {/* Content */}
        <span style={{ fontSize: "22px", zIndex: 1, marginBottom: "8px" }}>{book.coverEmoji}</span>
        <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: "12px", color: "rgba(255,220,160,.85)", textAlign: "center", padding: "0 10px", lineHeight: 1.3, zIndex: 1, writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}>
          {book.title}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "12px", color: "rgba(255,200,130,.65)" }}>{book.title}</div>
        <div style={{ fontFamily: "'Lora',serif", fontSize: "10px", color: "rgba(255,160,60,.3)", marginTop: "2px" }}>{book._count?.entries ?? 0} entries</div>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  fontFamily: "'Lora',serif",
  fontSize: "10px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "rgba(100,55,20,.5)",
  marginBottom: "6px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  fontFamily: "'Lora',serif",
  fontSize: "13px",
  background: "rgba(120,70,20,.06)",
  border: "1px solid rgba(120,70,20,.2)",
  borderRadius: "4px",
  padding: "10px 12px",
  outline: "none",
  color: "rgba(35,14,3,.8)",
  marginBottom: "16px",
};
