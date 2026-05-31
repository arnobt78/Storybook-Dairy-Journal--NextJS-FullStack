"use client";

/**
 * LandingCover — the closed leather-bound book on the landing page.
 *
 * Animation stages:
 *  1. Idle:    book sits with subtle hover tilt + continuous shine sweep.
 *  2. Opening: `.cover-book-opening` class fires two concurrent effects:
 *       a. Book container tilts back mildly (rotateY: 0 → -18deg) so the
 *          hinge has room to swing open visually.
 *       b. `.cover-hinge` (the front cover face) rotates from rotateY(0) to
 *          rotateY(-165deg) around `transform-origin: left center` — the spine
 *          edge — exactly like a real book cover hinging open.
 *       c. `.cover-fold-sheet` inner pages fan open behind the hinge.
 *       d. `.cover-title-stack` fades out as the cover swings away.
 *  3. Navigate: after COVER_OPEN_MS the router pushes the target route.
 *
 * The book is split into three z-layers:
 *   z-index 1 — `.cover-pages-bg`   : cream page stack (always behind the cover)
 *   z-index 2 — `.cover-fold-inner` : fanning inner pages
 *   z-index 3 — `.cover-hinge`      : the hinged leather front cover (back-face hidden)
 *   z-index 20 — `.cover-spine`     : fixed leather spine (never rotates)
 *
 * The cover click and both CTA buttons call the same `openAndNavigate` handler.
 * Once `coverOpening` is true, all interactions are disabled to prevent double-fire.
 */
import type { CSSProperties } from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/** Total ms the cover animation plays before router.push fires. */
const COVER_OPEN_MS = 900;

export function LandingCover() {
  const router = useRouter();
  const [coverOpening, setCoverOpening] = useState(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Prefetch auth pages so navigation feels instant after the cover opens */
  useEffect(() => {
    router.prefetch("/register");
    router.prefetch("/login");
  }, [router]);

  const openAndNavigate = useCallback(
    (href: "/register" | "/login") => {
      if (coverOpening) return;
      setCoverOpening(true);
      if (navTimer.current) clearTimeout(navTimer.current);
      navTimer.current = setTimeout(() => {
        router.push(href);
      }, COVER_OPEN_MS);
    },
    [coverOpening, router]
  );

  const linkStyle: CSSProperties = {
    fontFamily: "'Lora', serif",
    fontSize: "11px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
    cursor: coverOpening ? "default" : "pointer",
    pointerEvents: coverOpening ? "none" : "auto",
    transition: "opacity 0.2s",
    opacity: coverOpening ? 0.45 : 1,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 50% 30%, #2e160a 0%, #1a0c05 55%, #0e0603 100%)",
      }}
    >
      {/* Ambient top glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 900px 500px at 50% 0%, rgba(255,180,80,.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <style>{`
        /* ── Hover tilt when idle ── */
        .cover-wrap:hover .cover-book:not(.cover-book-opening) {
          transform: perspective(1200px) rotateY(-9deg) rotateX(3deg) translateY(-14px);
          box-shadow: -14px 0 32px rgba(0,0,0,.6), 22px 32px 90px rgba(0,0,0,.88),
            inset -7px 0 14px rgba(0,0,0,.38);
        }

        /* ── Base book state ── */
        .cover-book {
          transition: transform .7s cubic-bezier(.23,1,.32,1), box-shadow .7s ease;
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg);
          transform-style: preserve-3d;
        }

        /* ── Book container tilts back mildly as cover opens ──
           A milder tilt (-18deg vs the old -38deg) keeps the spine visible
           and gives the hinge room to swing open without going off-screen. */
        .cover-book.cover-book-opening {
          transform: perspective(1000px) rotateY(-18deg) rotateX(4deg) translateY(-14px) !important;
          box-shadow: -22px 0 44px rgba(0,0,0,.65), 28px 38px 90px rgba(0,0,0,.88),
            inset -8px 0 16px rgba(0,0,0,.42) !important;
          overflow: visible !important;
        }

        /* ── Hinged front cover ──
           transform-origin: left center = spine edge.
           z-index 3 sits above the page-bg (1) and fold-inner (2). */
        .cover-hinge {
          position: absolute;
          top: 0; bottom: 0; left: 26px; right: 0;
          transform-origin: left center;
          transform-style: preserve-3d;
          z-index: 3;
        }

        /* Cover swings open when book-opening fires */
        .cover-book-opening .cover-hinge {
          animation: coverHingeOpen 0.72s cubic-bezier(.23,1,.32,1) 0.1s forwards;
        }

        @keyframes coverHingeOpen {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(-165deg); }
        }

        /* Title fades as the cover swings open (animated by inline transition on the element) */
        .cover-book-opening .cover-title-stack {
          opacity: 0.2;
        }

        /* ── Inner fold sheets (behind the hinge) ── */
        .cover-fold-inner {
          position: absolute; left: 28px; right: 14px;
          top: 16px; bottom: 16px;
          z-index: 2; pointer-events: none;
          perspective: 900px; transform-style: preserve-3d;
        }
        .cover-fold-sheet {
          position: absolute; top: 0; bottom: 0; width: 50%;
          background: linear-gradient(180deg, #f7f0e2 0%, #e8dcc9 45%, #f0e6d4 100%);
          box-shadow: inset 0 0 24px rgba(120,70,20,.14), 0 0 0 1px rgba(120,70,20,.12);
          opacity: 0; transform: rotateY(0deg);
          transition: opacity .3s ease .05s, transform .8s cubic-bezier(.23,1,.32,1);
        }
        .cover-fold-sheet-l { left: 0; border-radius: 2px 0 0 2px; transform-origin: right center; }
        .cover-fold-sheet-r { right: 0; border-radius: 0 2px 2px 0; transform-origin: left center; }
        .cover-fold-sheet::before {
          content:''; position:absolute; inset:0;
          background-image: repeating-linear-gradient(
            transparent,transparent 27px,
            rgba(120,80,30,.07) 27px,rgba(120,80,30,.07) 28px
          );
          background-position: 0 36px;
        }
        .cover-book-opening .cover-fold-sheet   { opacity: 1; }
        .cover-book-opening .cover-fold-sheet-l { transform: rotateY(-55deg); }
        .cover-book-opening .cover-fold-sheet-r { transform: rotateY(50deg); }
      `}</style>

      {/* ── Book ── */}
      <div
        className="cover-wrap"
        onClick={() => openAndNavigate("/register")}
        style={{
          cursor: coverOpening ? "default" : "pointer",
          position: "relative",
        }}
      >
        <div
          className={`cover-book${coverOpening ? " cover-book-opening" : ""}`}
          style={{
            width: "240px",
            height: "340px",
            position: "relative",
            borderRadius: "3px 14px 14px 3px",
            boxShadow:
              "-8px 0 24px rgba(0,0,0,.55), 10px 12px 50px rgba(0,0,0,.75), inset -4px 0 10px rgba(0,0,0,.3)",
            overflow: "hidden",
          }}
        >
          {/* Fixed leather spine — stays in place as the cover opens */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "26px",
              background:
                "linear-gradient(90deg,#1e0c03 0%,#4a2008 40%,#6b3410 60%,#4a2008 100%)",
              borderRadius: "3px 0 0 3px",
              zIndex: 20,
            }}
          />

          {/* Cream page stack — z-index 1, revealed as the hinge swings open */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "26px",
              right: 0,
              background:
                "linear-gradient(180deg, #f7f0e2 0%, #f0e6d4 50%, #e8dcc9 100%)",
              borderRadius: "0 12px 12px 0",
              zIndex: 1,
              overflow: "hidden",
            }}
          >
            {/* Ruled lines on pages for depth */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "repeating-linear-gradient(transparent,transparent 27px,rgba(120,80,30,.06) 27px,rgba(120,80,30,.06) 28px)",
                backgroundPosition: "0 36px",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Inner fold sheets — fan open behind the hinge (z-index 2) */}
          <div className="cover-fold-inner" aria-hidden>
            <div className="cover-fold-sheet cover-fold-sheet-l" />
            <div className="cover-fold-sheet cover-fold-sheet-r" />
          </div>

          {/* Hinged front cover — rotates open from the spine edge (z-index 3) */}
          <div className="cover-hinge">
            {/* Front face — the leather exterior.
                cover-shine class applied here so the sweep animation and its
                ::after pseudo-element are scoped to this face and hidden
                automatically when backface-visibility kicks in during the swing. */}
            <div
              className="cover-shine"
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                background:
                  "linear-gradient(155deg,#5d2e0c 0%,#8b4513 25%,#70380f 55%,#3d1a06 100%)",
                borderRadius: "0 12px 12px 0",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Gold border inset */}
              <div
                style={{
                  position: "absolute",
                  inset: "16px",
                  border: "1px solid rgba(255,170,70,.2)",
                  borderRadius: "2px",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
              {/* Leather texture lines */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "repeating-linear-gradient(160deg,transparent 0,transparent 6px,rgba(0,0,0,.04) 6px,rgba(0,0,0,.04) 7px)",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              />
              {/* Title stack — fades as the cover swings open */}
              <div
                className="cover-title-stack"
                style={{
                  position: "relative",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "opacity 0.4s ease",
                }}
              >
                <div
                  className="float-y"
                  style={{
                    fontSize: "26px",
                    opacity: 0.55,
                    filter: "sepia(1) brightness(.8)",
                  }}
                >
                  ❧
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontSize: "26px",
                    color: "rgba(255,205,130,.88)",
                    textAlign: "center",
                    padding: "0 36px",
                    lineHeight: 1.25,
                    textShadow: "0 3px 12px rgba(0,0,0,.5)",
                    margin: "10px 0",
                  }}
                >
                  StoryBook
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontSize: "13px",
                    color: "rgba(255,195,110,.6)",
                    textAlign: "center",
                    padding: "0 36px",
                  }}
                >
                  Journal
                </div>
                <div
                  style={{
                    fontFamily: "'IM Fell English', serif",
                    fontSize: "10px",
                    letterSpacing: "4px",
                    color: "rgba(255,170,70,.4)",
                    marginTop: "8px",
                  }}
                >
                  2 0 2 6
                </div>
              </div>
            </div>

            {/* Back face — inside of cover (cream paper), visible after full swing */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background:
                  "linear-gradient(180deg, #f5ede0 0%, #f0e6d4 60%, #e8dcc9 100%)",
                borderRadius: "0 12px 12px 0",
                overflow: "hidden",
              }}
            >
              {/* Subtle ruled lines on inside cover */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "repeating-linear-gradient(transparent,transparent 27px,rgba(120,80,30,.06) 27px,rgba(120,80,30,.06) 28px)",
                  backgroundPosition: "0 40px",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA breathing text */}
      <div
        className="breathe"
        style={{
          marginTop: "44px",
          fontFamily: "'IM Fell English', serif",
          fontStyle: "italic",
          fontSize: "14px",
          color: "rgba(255,180,90,.5)",
        }}
      >
        {coverOpening ? "Opening your journal…" : "Open to begin your story"}
      </div>

      {/* Auth CTAs */}
      <div
        style={{
          marginTop: "28px",
          display: "flex",
          gap: "14px",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => openAndNavigate("/register")}
          style={{
            ...linkStyle,
            background: "rgba(90,40,10,.82)",
            color: "rgba(255,215,150,.92)",
            border: "none",
            padding: "11px 26px",
            borderRadius: "3px",
            boxShadow: "0 2px 10px rgba(0,0,0,.3)",
          }}
        >
          Start Journaling
        </button>
        <button
          type="button"
          onClick={() => openAndNavigate("/login")}
          style={{
            ...linkStyle,
            background: "transparent",
            color: "rgba(255,170,70,.5)",
            border: "1px solid rgba(255,170,70,.22)",
            padding: "11px 26px",
            borderRadius: "3px",
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
