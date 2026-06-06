"use client";

/**
 * Reusable confirmation overlay — paper theme (dashboard) or dark theme (journal nav).
 * Used before destructive DELETE calls; parent handles API + query invalidation.
 *
 * ── WALKTHROUGH ──
 *  Guard pattern: parent sets `open` state; this modal only confirms intent.
 *  `variant="dark"` matches journal nav; `"paper"` matches shelf modals.
 */
import type { CSSProperties, ReactNode } from "react";
import { RippleButton } from "@/components/ui/ripple-button";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** paper = cream modal (shelf); dark = journal night theme */
  variant?: "paper" | "dark";
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
  variant = "paper",
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDark = variant === "dark";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      style={{
        position: "fixed",
        inset: 0,
        background: isDark ? "rgba(0,0,0,.75)" : "rgba(0,0,0,.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        style={{
          background: isDark ? "rgba(16,6,1,.96)" : "rgba(244,236,218,.97)",
          borderRadius: "8px",
          padding: "28px 32px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 20px 60px rgba(0,0,0,.6)",
          border: isDark
            ? "1px solid rgba(255,160,60,.12)"
            : "1px solid rgba(120,70,20,.15)",
        }}
      >
        <h2
          id="confirm-dialog-title"
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "20px",
            color: isDark ? "rgba(255,205,130,.9)" : "rgba(35,14,3,.85)",
            margin: "0 0 12px",
            lineHeight: 1.25,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: "'Lora',serif",
            fontSize: "13px",
            lineHeight: 1.6,
            color: isDark ? "rgba(255,200,140,.55)" : "rgba(55,28,8,.6)",
            margin: "0 0 24px",
          }}
        >
          {description}
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <RippleButton
            type="button"
            disabled={loading}
            onClick={onCancel}
            style={cancelBtn(isDark)}
          >
            {cancelLabel}
          </RippleButton>
          <RippleButton
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={confirmBtn(isDark, loading)}
          >
            {loading ? "Removing…" : confirmLabel}
          </RippleButton>
        </div>
      </div>
    </div>
  );
}

function cancelBtn(dark: boolean): CSSProperties {
  return {
    fontFamily: "'Lora',serif",
    fontSize: "11px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    background: "transparent",
    color: dark ? "rgba(255,175,90,.55)" : "rgba(100,55,20,.55)",
    border: dark
      ? "1px solid rgba(255,160,60,.2)"
      : "1px solid rgba(120,70,20,.22)",
    padding: "8px 18px",
    borderRadius: "3px",
    cursor: "pointer",
  };
}

function confirmBtn(dark: boolean, loading: boolean): CSSProperties {
  return {
    fontFamily: "'Lora',serif",
    fontSize: "11px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    background: dark ? "rgba(120,40,20,.85)" : "rgba(90,40,10,.82)",
    color: "rgba(255,215,150,.92)",
    border: "none",
    padding: "8px 20px",
    borderRadius: "3px",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
}
