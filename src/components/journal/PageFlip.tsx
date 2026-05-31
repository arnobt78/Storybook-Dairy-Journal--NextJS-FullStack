"use client";

/**
 * PageFlipOverlay — 3-D page-turn effect.
 *
 * Renders as a direct sibling of LeftPage and RightPage inside the flex +
 * preserve-3d container so it inherits the correct perspective context.
 *
 * Front face = right-page paper (the page being turned away).
 * Back face  = left-page paper (reverse side visible mid-turn).
 *
 * Both faces carry ruled-line + margin-line textures for realism.
 * Depth cue is a static `box-shadow` on the flip root only — animating `filter` on
 * the same layer as `transform` caused post-flip edge shimmer / “vibration” next to
 * real pages once the overlay unmounted (especially under a parent `filter`).
 *
 * Width matches --page-w CSS variable; falls back to 360px.
 */
import type { FlipDirection } from "@/types";

interface PageFlipProps {
  direction: FlipDirection;
}

/** Ruled lines + red margin line applied to both faces of the flip sheet */
function RuledLinesTexture() {
  return (
    <>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(transparent,transparent 27px,rgba(120,80,30,.08) 27px,rgba(120,80,30,.08) 28px)",
        backgroundPosition: "0 52px", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", left: "58px", top: 0, bottom: 0, width: "1px",
        background: "rgba(220,100,80,.12)", pointerEvents: "none",
      }} />
    </>
  );
}

export function PageFlipOverlay({ direction }: PageFlipProps) {
  return (
    <>
      <style>{`
        @keyframes flipFwd {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes flipBwd {
          0%   { transform: rotateY(-180deg); }
          100% { transform: rotateY(0deg); }
        }
        .flip-fwd { animation: flipFwd .65s cubic-bezier(.4,0,.2,1) forwards; }
        .flip-bwd { animation: flipBwd .65s cubic-bezier(.4,0,.2,1) forwards; }
      `}</style>
      <div
        className={direction === "fwd" ? "flip-fwd" : "flip-bwd"}
        style={{
          position: "absolute", top: 0, right: 0,
          width: "var(--page-w, 360px)", height: "var(--page-h, 540px)",
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
          pointerEvents: "none", zIndex: 30,
        }}
      >
        {/* Front face — right-page paper */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          borderRadius: "0 4px 4px 0",
          background: "linear-gradient(to left, #e8dcc9 0%, #f4ecda 60%, #ede0c8 100%)",
          boxShadow: "inset 10px 0 24px rgba(120,70,20,.1)",
          overflow: "hidden",
        }}>
          <RuledLinesTexture />
        </div>
        {/* Back face — left-page paper */}
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          borderRadius: "4px 0 0 4px",
          background: "linear-gradient(to right, #ede1cc 0%, #f4ecda 60%, #ede0c8 100%)",
          overflow: "hidden",
        }}>
          <RuledLinesTexture />
        </div>
      </div>
    </>
  );
}
