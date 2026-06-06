"use client";

/**
 * LeftPage — left half of the open book spread.
 *
 * Shows:
 *  • Previous entry preview (title, excerpt, mood/weather/word count).
 *  • Entry list TOC with staggered animation after page flip.
 *  • Clickable entries navigate via the parent onNavigate callback.
 *
 * Sizing: controlled by CSS custom properties --page-w / --page-h.
 *
 * ── WALKTHROUGH: page flip companion (left leaf) ──
 *  This page does NOT run the flip animation — it stays static while `PageFlipOverlay`
 *  (mounted in BookSpread) rotates over the right page. Entry list clicks call
 *  `onNavigate(idx)` which triggers flip-then-focus in the parent.
 *  3D hit-testing: outer shell is `pointerEvents: none`; scrollable inner stack is `auto`.
 */
import type { JournalEntry } from "@/types";
import { stripHtml } from "@/lib/utils";

interface LeftPageProps {
  currentEntry: JournalEntry;
  prevEntry: JournalEntry | null;
  entries: JournalEntry[];
  currentIdx: number;
  pageNumber: number;
  onNavigate: (idx: number) => void;
}

export function LeftPage({ prevEntry, entries, currentIdx, pageNumber, onNavigate }: LeftPageProps) {
  return (
    /* Outer shell ignores pointer hits (see `BookSpread` comment): 3-D AABB can overlap sibling page. */
    <div style={{
      width: "var(--page-w, 360px)", height: "var(--page-h, 540px)",
      position: "relative",
      background: "var(--theme-page-left, linear-gradient(to right, #ede1cc 0%, #f4ecda 60%, #ede0c8 100%))",
      borderRadius: "4px 0 0 4px",
      boxShadow: "inset -10px 0 24px rgba(120,70,20,.12), inset 3px 0 8px rgba(200,160,100,.08)",
      flexShrink: 0, overflow: "hidden",
      pointerEvents: "none",
    }}>
      {/* Ruled lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(transparent,transparent 27px,rgba(120,80,30,.1) 27px,rgba(120,80,30,.1) 28px)",
        backgroundPosition: "0 52px", pointerEvents: "none", zIndex: 0,
      }} />
      {/* Red margin line */}
      <div style={{
        position: "absolute", left: "58px", top: 0, bottom: 0, width: "1px",
        background: "rgba(220,100,80,.18)", pointerEvents: "none", zIndex: 0,
      }} />
      {/* Right curl shadow toward spine */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: "28px",
        background: "linear-gradient(to left, rgba(100,50,10,.12) 0%, transparent 100%)",
        pointerEvents: "none", zIndex: 2,
      }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
        {/* Page number */}
        <div style={{
          fontFamily: "'IM Fell English', serif", fontSize: "10px",
          color: "rgba(100,60,25,.4)", textAlign: "center",
          padding: "8px 0 3px", flexShrink: 0,
        }}>
          — {pageNumber} —
        </div>

        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 22px 12px" }}>
          {/* Previous entry preview */}
          {prevEntry ? (
            <div style={{ marginTop: "10px" }}>
              <SectionLabel>Previous</SectionLabel>
              <div style={{ fontFamily: "'IM Fell English', serif", fontSize: "11px", color: "rgba(140,80,30,.55)", marginBottom: "4px" }}>
                {prevEntry.entryDate}
              </div>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontStyle: "italic",
                fontSize: "17px", color: "rgba(45,20,5,.65)", lineHeight: 1.25, marginBottom: "8px",
              }}>
                {prevEntry.title}
              </div>
              <div style={{
                fontFamily: "'Lora', serif", fontStyle: "italic",
                fontSize: "11.5px", lineHeight: 1.85, color: "rgba(55,28,8,.5)",
              }}>
                {stripHtml(prevEntry.content).slice(0, 180) || "No words written yet."}
                {stripHtml(prevEntry.content).length > 180 ? "…" : ""}
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                marginTop: "10px", paddingTop: "8px",
                borderTop: "1px solid rgba(120,70,20,.12)",
              }}>
                <span style={{ fontSize: "13px" }}>{prevEntry.mood}</span>
                <span style={{ fontSize: "13px" }}>{prevEntry.weather}</span>
                <span style={{ fontFamily: "'Lora', serif", fontSize: "10px", color: "rgba(100,55,20,.38)", marginLeft: "auto" }}>
                  {prevEntry.wordCount} words
                </span>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "20px" }}>
              <SectionLabel>Journal</SectionLabel>
              <div style={{ fontSize: "16px", opacity: 0.15, textAlign: "center", margin: "8px 0" }}>✦ ✦ ✦</div>
              <div style={{
                fontFamily: "'Lora', serif", fontStyle: "italic",
                fontSize: "12px", color: "rgba(100,55,20,.35)", lineHeight: 1.9,
              }}>
                Every great story begins somewhere. This is where yours begins.
              </div>
            </div>
          )}

          {/* ── PAGE FLIP: entry list re-staggers after parent flip completes ── */}
          {/* Entry list with stagger animation */}
          <div style={{ marginTop: "20px" }}>
            <SectionLabel>All Entries</SectionLabel>
            {entries.length === 0 ? (
              <div style={{ fontFamily: "'Lora', serif", fontStyle: "italic", fontSize: "11px", color: "rgba(100,55,20,.3)" }}>
                No entries yet
              </div>
            ) : (
              <div className="entry-list-stagger">
                {entries.map((e, i) => (
                  <div
                    key={e.id}
                    onClick={() => onNavigate(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "7px 0", borderBottom: "1px solid rgba(120,70,20,.08)",
                      cursor: "pointer", opacity: i === currentIdx ? 1 : 0.7,
                      transition: "opacity .15s",
                    }}
                  >
                    <span style={{ fontSize: "12px", flexShrink: 0 }}>{e.mood}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Playfair Display', serif", fontSize: "11px",
                        color: "rgba(45,20,5,.75)", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis",
                      }}>{e.title}</div>
                      <div style={{ fontFamily: "'Lora', serif", fontSize: "9.5px", color: "rgba(100,55,20,.4)" }}>
                        {e.entryDate}
                      </div>
                    </div>
                    <div style={{
                      width: "5px", height: "5px", borderRadius: "50%", flexShrink: 0,
                      background: i === currentIdx ? "rgba(170,90,30,.75)" : "rgba(120,70,20,.2)",
                    }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Lora', serif", fontSize: "8px", letterSpacing: "3.5px",
      textTransform: "uppercase", color: "rgba(100,55,20,.35)",
      display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px",
    }}>
      {children}
      <div style={{ flex: 1, height: "1px", background: "rgba(120,70,20,.15)" }} />
    </div>
  );
}
