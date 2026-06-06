"use client";

/**
 * RightPage — the journal entry view/edit panel.
 *
 * READ mode:  Renders HTML content via dangerouslySetInnerHTML (TipTap output).
 *             Page-stagger animation classes applied after flip completes.
 * WRITE mode: Textarea-based editor with mood/weather pickers, tag input,
 *             word count, AI Assist button.
 *
 * Sizing: driven by CSS custom properties --page-w / --page-h so the entire
 * book scales responsively from the root :root rule in globals.css.
 *
 * ── WALKTHROUGH: page flip stagger (right leaf) ──
 *  After flip completes, `flipDir` from BookSpread drives CSS classes
 *  `page-stagger-fwd` / `page-stagger-bwd` on read-mode content so lines animate in.
 *  Stagger is suppressed while `isFlipping` or `isWriting` to avoid fighting the overlay.
 *  Write mode is controlled here; autosave/offline persistence live in BookSpread.
 */
import dynamic from "next/dynamic";
import { useState } from "react";
import type { JournalEntry, EntryDraft } from "@/types";
import { MOODS, WEATHERS } from "@/constants";
import { wordCount } from "@/lib/utils";
import type { FlipDirection } from "@/types";
import { RippleButton } from "@/components/ui/ripple-button";

const JournalEditor = dynamic(
  () => import("@/components/editor/JournalEditor").then((m) => ({ default: m.JournalEditor })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          flex: 1,
          minHeight: 80,
          fontFamily: "'Lora',serif",
          fontStyle: "italic",
          fontSize: "12px",
          color: "rgba(120,70,30,.32)",
          paddingTop: 12,
        }}
      >
        Loading editor…
      </div>
    ),
  },
);

interface RightPageProps {
  entry: JournalEntry;
  pageNumber: number;
  isWriting: boolean;
  draft: EntryDraft;
  isSaving: boolean;
  flipDir: FlipDirection | null;
  isFlipping: boolean;
  onStartWriting: () => void;
  onDraftChange: (field: keyof EntryDraft, value: string | string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onAiAssist: () => void;
  isAiThinking: boolean;
  /** Opens confirm flow — destructive DELETE handled in BookSpread */
  onDeleteEntry?: () => void;
  canDeleteEntry?: boolean;
}

export function RightPage({
  entry, pageNumber, isWriting, draft, isSaving,
  flipDir, isFlipping,
  onStartWriting, onDraftChange, onSave, onCancel, onAiAssist, isAiThinking,
  onDeleteEntry, canDeleteEntry = true,
}: RightPageProps) {
  const [newTag, setNewTag] = useState("");

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      onDraftChange("tags", [...draft.tags, newTag.trim()]);
      setNewTag("");
    }
    if (e.key === "Backspace" && !newTag && draft.tags.length) {
      onDraftChange("tags", draft.tags.slice(0, -1));
    }
  };

  const wc = wordCount(draft.content);

  /* Stagger class applied after flip so content lines animate in sequentially */
  const staggerClass = !isFlipping && !isWriting
    ? (flipDir === "fwd" ? "page-stagger-fwd" : flipDir === "bwd" ? "page-stagger-bwd" : "")
    : "";

  return (
    /* Outer shell ignores pointer hits — same 3-D hit-testing rationale as `LeftPage`. */
    <div style={{
      width: "var(--page-w, 360px)", height: "var(--page-h, 540px)",
      position: "relative",
      background: "var(--theme-page-right, linear-gradient(to left, #e8dcc9 0%, #f4ecda 60%, #ede0c8 100%))",
      borderRadius: "0 4px 4px 0",
      boxShadow: "inset 10px 0 24px rgba(120,70,20,.1)",
      flexShrink: 0, overflow: "hidden",
      pointerEvents: "none",
    }}>
      {/* Ruled lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(transparent,transparent 27px,rgba(120,80,30,.1) 27px,rgba(120,80,30,.1) 28px)",
        backgroundPosition: "0 52px", pointerEvents: "none", zIndex: 0,
      }} />
      {/* Left curl shadow */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "28px",
        background: "linear-gradient(to right,rgba(100,50,10,.1) 0%,transparent 100%)",
        pointerEvents: "none", zIndex: 2,
      }} />

      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
        {/* Page number */}
        <div style={{
          fontFamily: "'IM Fell English',serif", fontSize: "10px",
          color: "rgba(100,60,25,.4)", textAlign: "center",
          padding: "8px 0 3px", flexShrink: 0,
        }}>
          — {pageNumber} —
        </div>

        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          overflow: "hidden", padding: "2px 24px 12px",
        }}>
          {/* Date header */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              fontFamily: "'IM Fell English',serif", fontSize: "11px",
              color: "rgba(140,80,30,.55)", marginBottom: "2px",
            }}>
              <span>{entry.entryDate}</span>
              <span style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(170,95,35,.45)" }}>
                {entry.weekday}
              </span>
            </div>
          </div>

          {isWriting ? (
            /* ── WRITE MODE ── */
            <>
              <input
                value={draft.title}
                onChange={e => onDraftChange("title", e.target.value)}
                placeholder="Title your entry…"
                style={{
                  fontFamily: "'Playfair Display',serif", fontStyle: "italic",
                  fontSize: "21px", color: "rgba(35,14,3,.82)",
                  background: "transparent", border: "none", outline: "none",
                  width: "100%", lineHeight: 1.2, margin: "6px 0 8px",
                }}
              />
              <div style={{ height: "1px", background: "linear-gradient(to right,rgba(120,70,20,.25),transparent)", marginBottom: "10px", flexShrink: 0 }} />

              <MiniLabel>Mood</MiniLabel>
              <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", marginBottom: "6px" }}>
                {MOODS.map(m => (
                  <RippleButton key={m} type="button" onClick={() => onDraftChange("mood", m)} style={{
                    fontSize: "13px", background: "none", border: "none", cursor: "pointer",
                    padding: "2px", borderRadius: "4px",
                    opacity: draft.mood === m ? 1 : 0.38,
                    transform: draft.mood === m ? "scale(1.15)" : "scale(1)",
                    transition: "all .15s",
                  }}>{m}</RippleButton>
                ))}
              </div>

              <MiniLabel>Weather</MiniLabel>
              <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", marginBottom: "8px" }}>
                {WEATHERS.map(w => (
                  <RippleButton key={w} type="button" onClick={() => onDraftChange("weather", w)} style={{
                    fontSize: "13px", background: "none", border: "none", cursor: "pointer",
                    padding: "2px", borderRadius: "4px",
                    opacity: draft.weather === w ? 1 : 0.38,
                    transform: draft.weather === w ? "scale(1.15)" : "scale(1)",
                    transition: "all .15s",
                  }}>{w}</RippleButton>
                ))}
              </div>

              <JournalEditor
                content={draft.content}
                onChange={(html) => onDraftChange("content", html)}
                placeholder="Write what's on your mind today…"
                autoFocus
              />

              {isAiThinking && (
                <div style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontSize: "11px", color: "rgba(100,55,20,.4)", marginTop: "4px" }}>
                  Writing…
                </div>
              )}

              {/* Tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                {draft.tags.map(t => (
                  <span key={t} style={{
                    fontFamily: "'Lora',serif", fontSize: "10px", color: "rgba(110,60,22,.6)",
                    background: "rgba(120,70,20,.09)", padding: "2px 8px",
                    borderRadius: "20px", border: "1px solid rgba(120,70,20,.14)",
                  }}>#{t}</span>
                ))}
                <input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={handleTagKey}
                  placeholder="+ tag"
                  style={{
                    fontFamily: "'Lora',serif", fontSize: "10px",
                    background: "rgba(120,70,20,.07)", border: "1px solid rgba(120,70,20,.18)",
                    borderRadius: "20px", padding: "2px 9px", outline: "none",
                    color: "rgba(45,20,5,.75)", width: "70px",
                  }}
                />
              </div>

              {/* Write footer */}
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                paddingTop: "8px", marginTop: "8px",
                borderTop: "1px solid rgba(120,70,20,.1)", flexShrink: 0,
              }}>
                <span style={{ fontFamily: "'Lora',serif", fontSize: "10px", color: "rgba(100,55,20,.38)", marginRight: "auto" }}>{wc} words</span>
                <RippleButton type="button" onClick={onAiAssist} disabled={isAiThinking || !draft.content.trim()} style={{
                  fontFamily: "'Lora',serif", fontSize: "9px", letterSpacing: "1.5px",
                  textTransform: "uppercase", background: "rgba(80,35,120,.18)",
                  color: "rgba(200,160,255,.65)", border: "1px solid rgba(140,80,220,.2)",
                  padding: "4px 12px", borderRadius: "20px", cursor: "pointer",
                  opacity: isAiThinking || !draft.content.trim() ? 0.3 : 1,
                }}>✦ AI Assist</RippleButton>
                <RippleButton type="button" onClick={onCancel} style={{
                  fontFamily: "'Lora',serif", fontSize: "9.5px", letterSpacing: "1.5px",
                  textTransform: "uppercase", background: "transparent",
                  color: "rgba(100,55,20,.5)", border: "1px solid rgba(120,70,20,.22)",
                  padding: "5px 12px", borderRadius: "3px", cursor: "pointer",
                }}>Cancel</RippleButton>
                <RippleButton type="button" onClick={onSave} disabled={isSaving} shine style={{
                  fontFamily: "'Lora',serif", fontSize: "9.5px", letterSpacing: "1.5px",
                  textTransform: "uppercase", background: "rgba(90,40,10,.82)",
                  color: "rgba(255,215,150,.92)", border: "none",
                  padding: "5px 14px", borderRadius: "3px", cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,.3)",
                }}>{isSaving ? "Saving…" : "Save"}</RippleButton>
              </div>
            </>
          ) : (
            /* ── READ MODE with stagger animation ── */
            <div className={staggerClass} style={{
              flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
            }}>
              {/* Title */}
              <div style={{
                fontFamily: "'Playfair Display',serif", fontStyle: "italic",
                fontSize: "22px", color: "rgba(35,14,3,.82)", lineHeight: 1.2,
                margin: "6px 0 8px",
              }}>
                {entry.title}
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "linear-gradient(to right,rgba(120,70,20,.25),transparent)", marginBottom: "12px", flexShrink: 0 }} />

              {/* Body */}
              <div style={{
                fontFamily: "'Lora',serif", fontSize: "13px", lineHeight: 1.92,
                color: "rgba(35,14,3,.78)", flex: 1, overflowY: "auto",
                scrollbarWidth: "none",
              }}>
                {entry.content
                  ? <div className="journal-prose" dangerouslySetInnerHTML={{ __html: entry.content }} />
                  : (
                    <div style={{ textAlign: "center", paddingTop: "28px" }}>
                      <span style={{ fontSize: "28px", display: "block", opacity: 0.4, marginBottom: "10px" }}>✒</span>
                      <span style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontSize: "12px", color: "rgba(120,70,30,.32)" }}>
                        This page awaits your words…
                      </span>
                    </div>
                  )}
              </div>

              {/* Tags */}
              {entry.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "10px", flexShrink: 0 }}>
                  {entry.tags.map(t => (
                    <span key={t} style={{
                      fontFamily: "'Lora',serif", fontSize: "10px", color: "rgba(110,60,22,.6)",
                      background: "rgba(120,70,20,.09)", padding: "2px 8px",
                      borderRadius: "20px", border: "1px solid rgba(120,70,20,.14)",
                    }}>#{t}</span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                paddingTop: "10px", marginTop: "8px",
                borderTop: "1px solid rgba(120,70,20,.1)", flexShrink: 0,
              }}>
                <span style={{ fontSize: "15px" }}>{entry.mood}</span>
                <span style={{ fontSize: "15px" }}>{entry.weather}</span>
                <span style={{ fontFamily: "'Lora',serif", fontSize: "10px", color: "rgba(100,55,20,.38)", marginRight: "auto" }}>
                  {entry.wordCount} words
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
                {onDeleteEntry && canDeleteEntry && (
                  <RippleButton type="button" onClick={onDeleteEntry} style={{
                    fontFamily: "'Lora',serif", fontSize: "9px", letterSpacing: "1.5px",
                    textTransform: "uppercase", background: "transparent",
                    color: "rgba(140,50,30,.55)", border: "1px solid rgba(140,50,30,.22)",
                    padding: "4px 10px", borderRadius: "3px", cursor: "pointer",
                  }}>Remove page</RippleButton>
                )}
                <RippleButton type="button" onClick={onStartWriting} style={{
                  fontFamily: "'Lora',serif", fontSize: "9.5px", letterSpacing: "1.5px",
                  textTransform: "uppercase", background: "transparent",
                  color: "rgba(100,55,20,.5)", border: "1px solid rgba(120,70,20,.2)",
                  padding: "4px 11px", borderRadius: "3px", cursor: "pointer",
                }}>✒ Edit</RippleButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Lora',serif", fontSize: "8px", letterSpacing: "2.5px",
      textTransform: "uppercase", color: "rgba(100,55,20,.35)", marginBottom: "3px",
    }}>
      {children}
    </div>
  );
}
