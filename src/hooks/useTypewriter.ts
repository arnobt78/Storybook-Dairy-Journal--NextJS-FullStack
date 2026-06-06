"use client";

/**
 * Character-by-character reveal for landing CTA hint text.
 * Respects prefers-reduced-motion — shows full string immediately.
 */
import { useEffect, useState } from "react";

export function useTypewriter(
  text: string,
  options?: { speedMs?: number; enabled?: boolean },
): { display: string; isComplete: boolean; isTyping: boolean } {
  const speedMs = options?.speedMs ?? 55;
  const enabled = options?.enabled ?? true;
  const [typedLength, setTypedLength] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || reducedMotion) return;

    let cancelled = false;
    let i = 0;

    const schedule = (fn: () => void) => {
      window.setTimeout(fn, 0);
    };

    schedule(() => {
      if (cancelled) return;
      setTypedLength(0);
      i = 0;

      const tick = () => {
        if (cancelled) return;
        i += 1;
        setTypedLength(i);
        if (i < text.length) {
          window.setTimeout(tick, speedMs);
        }
      };

      window.setTimeout(tick, speedMs);
    });

    return () => {
      cancelled = true;
    };
  }, [text, enabled, reducedMotion, speedMs]);

  if (!enabled) {
    return { display: "", isComplete: false, isTyping: false };
  }

  if (reducedMotion) {
    return { display: text, isComplete: true, isTyping: false };
  }

  const display = text.slice(0, typedLength);
  const isComplete = typedLength >= text.length && text.length > 0;

  return {
    display,
    isComplete,
    isTyping: typedLength > 0 && !isComplete,
  };
}
