"use client";

/**
 * Applies book theme tokens as CSS variables on the spread wrapper.
 */
import { useMemo, type CSSProperties } from "react";
import { getBookTheme } from "@/constants/themes";

export function useBookTheme(themeId: string) {
  return useMemo(() => {
    const theme = getBookTheme(themeId);
    return {
      "data-book-theme": theme.id,
      style: {
        ["--theme-page-left" as string]: theme.pageLeft,
        ["--theme-page-right" as string]: theme.pageRight,
        ["--theme-ink" as string]: theme.ink,
        ["--theme-ink-muted" as string]: theme.inkMuted,
        ["--theme-accent" as string]: theme.accent,
      } as CSSProperties,
    };
  }, [themeId]);
}
