"use client";

/**
 * usePageFlip — shared page-flip state for BookSpread and AuthBookShell.
 *
 * Uses a synchronous `flippingRef` as the re-entrancy guard rather than reading
 * `isFlipping` state, which can lag one frame under React 18/19 batching.
 * This prevents double-flip on rapid clicks or Strict-Mode double-invoke.
 *
 * FLIP_MS must stay in sync with the CSS keyframe duration in PageFlipOverlay.
 */
import { useState, useRef, useCallback } from "react";
import type { FlipDirection } from "@/types";

interface UsePageFlipReturn {
  isFlipping: boolean;
  flipDir: FlipDirection | null;
  triggerFlip: (dir: FlipDirection, onComplete?: () => void) => void;
  resetFlip: () => void;
}

/** Must match the animation duration in PageFlip.tsx CSS keyframes. */
const FLIP_MS = 650;

export function usePageFlip(): UsePageFlipReturn {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<FlipDirection | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Synchronous ref guard — state reads inside closures can be stale
   * for an entire render cycle under React 19 concurrent batching.
   */
  const flippingRef = useRef(false);

  const triggerFlip = useCallback((dir: FlipDirection, onComplete?: () => void) => {
    /* Re-entrancy guard: second call while flip is in progress is a no-op */
    if (flippingRef.current) return;
    flippingRef.current = true;
    setFlipDir(dir);
    setIsFlipping(true);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onComplete?.();
      flippingRef.current = false;
      setIsFlipping(false);
      setFlipDir(null);
      timer.current = null;
    }, FLIP_MS);
  }, []);

  /** Force-reset if a navigation unmount cut the animation short. */
  const resetFlip = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    flippingRef.current = false;
    setIsFlipping(false);
    setFlipDir(null);
  }, []);

  return { isFlipping, flipDir, triggerFlip, resetFlip };
}
