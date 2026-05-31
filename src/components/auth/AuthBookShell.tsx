"use client";

/**
 * AuthBookShell — wraps /login and /register in a two-page open-book spread.
 *
 * Key design decisions:
 *  1. No opacity-driven intro wrapper. The old approach (`opacity: 0 → 1` via React
 *     state + useEffect) created a temporary stacking context (opacity < 1) that
 *     flattened the inner `preserve-3d` context on every page load. It's replaced
 *     with a pure-CSS `auth-shell-root` keyframe that completes in 500ms and
 *     produces no stacking context once finished.
 *
 *  2. Spread layout: **spine (cover edge) | left page | right page** — the brown strip is
 *     the outer binding on the left (like a closed cover edge), not a bar between the
 *     two leaves. The gutter is paper + inset shadows only. Row depth is a single soft
 *     `box-shadow` — no parent `filter` (avoids 3-D edge jitter).
 *
 *  3. Spread transform is `perspective` only (no rotateX/Y on the row): those tilts
 *     with `preserve-3d` caused sub-pixel “vibrating” strokes after the flip sheet
 *     unmounted. Pointer-events: `none` on page shells + `auto` on inner stacks (same
 *     pattern as dashboard). Left copy skips `.auth-stagger`. Page size uses global
 *     `:root` `--page-w` / `--page-h`; auth `layout` centers the shell in the viewport.
 *
 *  4. Route push fires AFTER flip completes (onComplete callback) so the new RSC
 *     renders behind the overlay's back-face — no blank-then-pop flash.
 */
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageFlipOverlay } from "@/components/journal/PageFlip";
import { usePageFlip } from "@/hooks/usePageFlip";

const BOOK_COLOR = "#8b4513";

/** Push fires immediately after flip completes (0 ms), so the new RSC renders
 *  behind the overlay's back-face — eliminates the blank-then-flash. */
const POST_FLIP_PUSH_MS = 0;

function normalizeAuthPath(p: string): string {
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

export function AuthBookShell({ children }: { children: ReactNode }) {
  const pathname = normalizeAuthPath(usePathname());
  const router = useRouter();
  const { isFlipping, flipDir, triggerFlip } = usePageFlip();

  /**
   * Snapshot of pathname when a flip is armed.
   * Left-page text reads this during a flip to avoid swapping labels
   * at the router.push boundary (which fires under the overlay).
   */
  const [flipFromPath, setFlipFromPath] = useState<string | null>(null);
  const routeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Warm the opposite auth route so RSC payload is ready when the flip ends. */
  useEffect(() => {
    if (pathname === "/login") router.prefetch("/register");
    if (pathname === "/register") router.prefetch("/login");
  }, [pathname, router]);

  const clearPendingNav = () => {
    if (routeTimer.current) {
      clearTimeout(routeTimer.current);
      routeTimer.current = null;
    }
  };

  /**
   * Navigate to /register (forward flip).
   * Push fires in onComplete — AFTER flip animation ends — so RSC renders
   * behind the overlay's back-face (no flash).
   */
  const goRegister = () => {
    if (pathname === "/register") return;
    clearPendingNav();
    setFlipFromPath(pathname);
    triggerFlip("fwd", () => {
      setFlipFromPath(null);
      routeTimer.current = setTimeout(
        () => router.push("/register"),
        POST_FLIP_PUSH_MS
      );
    });
  };

  /**
   * Navigate to /login (backward flip).
   * Same push-after-complete pattern as goRegister.
   */
  const goLogin = () => {
    if (pathname === "/login") return;
    clearPendingNav();
    setFlipFromPath(pathname);
    triggerFlip("bwd", () => {
      setFlipFromPath(null);
      routeTimer.current = setTimeout(
        () => router.push("/login"),
        POST_FLIP_PUSH_MS
      );
    });
  };

  /* While a cross-auth navigation is in flight, keep footer controls idle. */
  const authNavBusy = isFlipping;

  /* Left page copy depends on which route we're currently SHOWING */
  const leftIsRegister =
    isFlipping && flipFromPath !== null
      ? flipFromPath === "/register"
      : pathname === "/register";

  /* Footer link shows the OPPOSITE of current pathname */
  const showRegisterLink = pathname === "/login";

  return (
    /* Render the book directly — no wrapper animation div.
       Any animated wrapper with animation-fill-mode:forwards retains a
       transform permanently after completion, creating a compositing layer
       that breaks pointer-event routing for preserve-3d descendants inside. */
    <div>
    {/* No `filter` here: parent filter + child `preserve-3d` repaints every frame and
        reads as edge “vibration” after the flip overlay unmounts; shadow lives on spread. */}
    <div style={{ position: "relative" }}>
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
            StoryBook
          </div>

          {/* Book spread: `pointer-events: none` on the 3-D row; order is spine | left | right
              so leather reads as the outer left binding, not a brown bar mid-spread.
              Perspective only — no rotateX/Y on this row. Inner page stacks use `auto`. */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              transformStyle: "preserve-3d",
              transform: "perspective(2400px)",
              position: "relative",
              pointerEvents: "none",
              boxShadow: "0 28px 56px rgba(0,0,0,.45)",
            }}
          >
            {/* Outer spine / cover edge — left background strip (not center gutter). */}
            <div
              style={{
                width: "var(--spine-w, 22px)",
                flexShrink: 0,
                alignSelf: "stretch",
                zIndex: 6,
                pointerEvents: "none",
                borderRadius: "4px 0 0 4px",
                background: `linear-gradient(180deg,
                  color-mix(in srgb,${BOOK_COLOR} 30%,#000) 0%,
                  ${BOOK_COLOR} 50%,
                  color-mix(in srgb,${BOOK_COLOR} 30%,#000) 100%)`,
                boxShadow:
                  "inset 2px 0 4px rgba(0,0,0,.25), inset -2px 0 4px rgba(0,0,0,.25)",
              }}
            />

            {/* ── LEFT PAGE ── */}
            {/* `pointer-events: none` on this full-size shell: under `preserve-3d` + perspective,
                browsers use an axis-aligned bounding box for hit-testing each rotated page plane,
                which can grow past the visible card and steal clicks meant for the right page.
                Inner wrappers restore `auto` only where we need real interaction. */}
            <div
              style={{
                width: "var(--page-w, 360px)",
                height: "var(--page-h, 540px)",
                position: "relative",
                background:
                  "linear-gradient(to right, #ede1cc 0%, #f4ecda 60%, #ede0c8 100%)",
                borderRadius: "0",
                boxShadow:
                  "inset -12px 0 20px rgba(120,70,20,.14), inset 3px 0 8px rgba(200,160,100,.08)",
                flexShrink: 0,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              {/* Ruled lines */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "repeating-linear-gradient(transparent,transparent 27px,rgba(120,80,30,.1) 27px,rgba(120,80,30,.1) 28px)",
                  backgroundPosition: "0 52px",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
              {/* Margin line */}
              <div
                style={{
                  position: "absolute",
                  left: "58px",
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  background: "rgba(220,100,80,.18)",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
              {/* Right curl shadow */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: "28px",
                  background:
                    "linear-gradient(to left,rgba(100,50,10,.12) 0%,transparent 100%)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />

              <div
                style={{
                  position: "relative",
                  /* Below the right-hand form column’s stacking for portaled menus (see globals). */
                  zIndex: 2,
                  height: "100%",
                  padding: "28px 24px 32px 72px",
                  display: "flex",
                  flexDirection: "column",
                  boxSizing: "border-box",
                  pointerEvents: "auto",
                }}
              >
                {/* Left marketing copy — no `.auth-stagger`: avoids opacity+flex “pop” on paint. */}
                <div
                  style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'IM Fell English',serif",
                      fontSize: "10px",
                      letterSpacing: "3px",
                      color: "rgba(100,55,20,.45)",
                      margin: 0,
                      textTransform: "uppercase",
                    }}
                  >
                    {leftIsRegister ? "New chapter" : "Returning reader"}
                  </p>
                  <div
                    style={{
                      fontSize: "34px",
                      marginTop: "10px",
                      lineHeight: 1,
                    }}
                    aria-hidden
                  >
                    {leftIsRegister ? "✨" : "🔑"}
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontStyle: "italic",
                      fontSize: "22px",
                      color: "rgba(35,14,3,.88)",
                      margin: "12px 0 0",
                      lineHeight: 1.2,
                    }}
                  >
                    {leftIsRegister ? "Your story awaits" : "Welcome back"}
                  </h2>
                  <p
                    style={{
                      fontFamily: "'Lora',serif",
                      fontSize: "12px",
                      fontStyle: "italic",
                      color: "rgba(100,55,20,.55)",
                      marginTop: "12px",
                      lineHeight: 1.65,
                    }}
                  >
                    {leftIsRegister
                      ? "Every great story begins somewhere. Inscribe your name and step onto the first page."
                      : "Pick up where you left off — your shelves and entries rest quietly until you return."}
                  </p>
                  <div
                    style={{
                      marginTop: "18px",
                      fontSize: "11px",
                      color: "rgba(120,70,30,.3)",
                      letterSpacing: "6px",
                    }}
                    aria-hidden
                  >
                    ◆ ◆ ◆
                  </div>
                </div>

                {/* Footer navigation — outside stagger so it's never hidden during delay */}
                <div
                  style={{
                    flexShrink: 0,
                    paddingTop: "20px",
                    position: "relative",
                    zIndex: 8,
                    pointerEvents: "auto",
                  }}
                >
                  {showRegisterLink ? (
                    <p
                      style={{
                        fontFamily: "'Lora',serif",
                        fontSize: "12px",
                        color: "rgba(100,55,20,.55)",
                        margin: 0,
                      }}
                    >
                      No account yet?{" "}
                      <button
                        type="button"
                        onClick={goRegister}
                        disabled={authNavBusy}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: authNavBusy ? "default" : "pointer",
                          color: "rgba(139,69,19,.85)",
                          textDecoration: "underline",
                          fontFamily: "'Lora',serif",
                          fontSize: "12px",
                        }}
                      >
                        Start your story
                      </button>
                    </p>
                  ) : (
                    <p
                      style={{
                        fontFamily: "'Lora',serif",
                        fontSize: "12px",
                        color: "rgba(100,55,20,.55)",
                        margin: 0,
                      }}
                    >
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={goLogin}
                        disabled={authNavBusy}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: authNavBusy ? "default" : "pointer",
                          color: "rgba(139,69,19,.85)",
                          textDecoration: "underline",
                          fontFamily: "'Lora',serif",
                          fontSize: "12px",
                        }}
                      >
                        Open your journal
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT PAGE ── */}
            {/* Same hit-testing rationale as the left page shell (see comment above). */}
            <div
              style={{
                width: "var(--page-w, 360px)",
                height: "var(--page-h, 540px)",
                position: "relative",
                background:
                  "linear-gradient(to left, #e8dcc9 0%, #f4ecda 60%, #ede0c8 100%)",
                borderRadius: "0 4px 4px 0",
                boxShadow: "inset 10px 0 24px rgba(120,70,20,.1)",
                flexShrink: 0,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              {/* Ruled lines */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "repeating-linear-gradient(transparent,transparent 27px,rgba(120,80,30,.1) 27px,rgba(120,80,30,.1) 28px)",
                  backgroundPosition: "0 52px",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
              {/* Left curl */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "28px",
                  background:
                    "linear-gradient(to right,rgba(100,50,10,.1) 0%,transparent 100%)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />

              {/* Right-page content — explicit pointerEvents:auto ensures form fields
                  receive events regardless of any inherited pointer-events quirks.
                  Higher z-index than the left column so popovers are not covered by
                  the left page’s 3-D hit slab; `overflowY: visible` so fixed/absolute
                  menus from `LoginForm` are not clipped by this scrollport. */}
              <div
                style={{
                  position: "relative",
                  zIndex: 12,
                  height: "100%",
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding: "28px 32px 28px 28px",
                  boxSizing: "border-box",
                  pointerEvents: "auto",
                  scrollbarWidth: "none",
                }}
                className="auth-right-scroll"
              >
                {children}
              </div>
            </div>

            {/* Page flip overlay — sibling of pages, same preserve-3d parent.
                position:relative on this container ensures top:0;right:0 lands
                on the right page's area, not the outer title/shadow wrapper. */}
            {isFlipping && flipDir && <PageFlipOverlay direction={flipDir} />}
          </div>
    </div>
    </div>
  );
}
