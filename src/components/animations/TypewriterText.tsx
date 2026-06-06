"use client";

/**
 * Typewriter hint — types text with blinking cursor, then pulses when complete.
 * Used on landing cover CTA ("Open to begin your story").
 */
import type { CSSProperties } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";

type TypewriterTextProps = {
  text: string;
  /** When true, skip typewriter and show static text (e.g. cover opening) */
  paused?: boolean;
  pausedText?: string;
  style?: CSSProperties;
  className?: string;
};

export function TypewriterText({
  text,
  paused = false,
  pausedText,
  style,
  className,
}: TypewriterTextProps) {
  const { display, isComplete } = useTypewriter(text, { enabled: !paused });
  const shown = paused ? (pausedText ?? text) : display;

  return (
    <div
      className={[isComplete && !paused ? "breathe" : "", className].filter(Boolean).join(" ")}
      style={{
        marginTop: "44px",
        fontFamily: "'IM Fell English', serif",
        fontStyle: "italic",
        fontSize: "clamp(13px, 3.5vw, 16px)",
        color: "rgba(255,180,90,.55)",
        minHeight: "1.4em",
        ...style,
      }}
      aria-live="polite"
    >
      {shown}
      {!paused && !isComplete && (
        <span className="typewriter-cursor" aria-hidden>
          |
        </span>
      )}
    </div>
  );
}
