"use client";

/**
 * Shared create/edit journal modal — used on the shelf and in the reader nav.
 * Parent handles POST/PATCH + journalSubtree invalidation after onSubmit.
 *
 * ── WALKTHROUGH ──
 *  Pure UI shell: no fetch here. BookShelf / BookSpread pass `onSubmit` that may
 *  route online PATCH/POST or offline queue (`enqueuePatchBookOffline`). Parent `key`
 *  remounts form state when switching create vs edit targets.
 */
import type { CSSProperties } from "react";
import { useState } from "react";
import { COVER_COLORS, COVER_EMOJIS } from "@/constants";
import { BOOK_THEMES } from "@/constants/themes";
import { RippleButton } from "@/components/ui/ripple-button";
import {
  DEFAULT_BOOK_FORM,
  type BookFormValues,
} from "@/types/book-form";

export type BookEditorModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: BookFormValues;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: BookFormValues) => void;
};

export function BookEditorModal({
  open,
  mode,
  initialValues,
  loading = false,
  onClose,
  onSubmit,
}: BookEditorModalProps) {
  if (!open) return null;

  return (
    <BookEditorForm
      mode={mode}
      initialValues={initialValues}
      loading={loading}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

/** Inner form — remount via parent `key` when opening create vs edit targets */
function BookEditorForm({
  mode,
  initialValues,
  loading = false,
  onClose,
  onSubmit,
}: Omit<BookEditorModalProps, "open">) {
  const [form, setForm] = useState<BookFormValues>(
    () => initialValues ?? DEFAULT_BOOK_FORM,
  );

  const title = mode === "create" ? "New Journal" : "Edit Journal";
  const submitLabel =
    mode === "create"
      ? loading
        ? "Creating…"
        : "Create Journal"
      : loading
        ? "Saving…"
        : "Save Changes";

  const handleSubmit = () => {
    if (!form.title.trim() || loading) return;
    onSubmit(form);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-editor-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          background: "rgba(244,236,218,.97)",
          borderRadius: "8px",
          padding: "36px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 20px 60px rgba(0,0,0,.6)",
        }}
      >
        <h2
          id="book-editor-title"
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "22px",
            color: "rgba(35,14,3,.85)",
            margin: "0 0 24px",
          }}
        >
          {title}
        </h2>
        <label style={labelStyle}>Title</label>
        <input
          style={inputStyle}
          placeholder="My Journal"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <label style={labelStyle}>Description (optional)</label>
        <input
          style={inputStyle}
          placeholder="A place for my thoughts…"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <label style={labelStyle}>Cover Color</label>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          {COVER_COLORS.map((c) => (
            <RippleButton
              key={c.value}
              type="button"
              aria-label={c.label}
              onClick={() => setForm((f) => ({ ...f, coverColor: c.value }))}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                background: c.value,
                cursor: "pointer",
                border:
                  form.coverColor === c.value
                    ? "3px solid rgba(35,14,3,.6)"
                    : "3px solid transparent",
                transition: "border .15s",
                padding: 0,
              }}
            />
          ))}
        </div>
        <label style={labelStyle}>Page Theme</label>
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          {BOOK_THEMES.map((theme) => (
            <RippleButton
              key={theme.id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, theme: theme.id }))}
              style={{
                fontFamily: "'Lora',serif",
                fontSize: "10px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                background:
                  form.theme === theme.id ? "rgba(120,70,20,.14)" : "rgba(120,70,20,.06)",
                border:
                  form.theme === theme.id
                    ? "1px solid rgba(120,70,20,.35)"
                    : "1px solid rgba(120,70,20,.15)",
                borderRadius: "20px",
                padding: "5px 10px",
                cursor: "pointer",
                color: "rgba(45,20,5,.75)",
              }}
            >
              {theme.label}
            </RippleButton>
          ))}
        </div>
        <label style={labelStyle}>Cover Emoji</label>
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          {COVER_EMOJIS.map((emoji) => (
            <RippleButton
              key={emoji}
              type="button"
              onClick={() => setForm((f) => ({ ...f, coverEmoji: emoji }))}
              style={{
                fontSize: "18px",
                background:
                  form.coverEmoji === emoji ? "rgba(120,70,20,.12)" : "none",
                border:
                  form.coverEmoji === emoji
                    ? "1px solid rgba(120,70,20,.3)"
                    : "1px solid transparent",
                borderRadius: "6px",
                padding: "3px 6px",
                cursor: "pointer",
              }}
            >
              {emoji}
            </RippleButton>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <RippleButton type="button" disabled={loading} onClick={onClose} style={cancelBtn}>
            Cancel
          </RippleButton>
          <RippleButton
            type="button"
            onClick={handleSubmit}
            disabled={!form.title.trim() || loading}
            shine
            style={submitBtn}
          >
            {submitLabel}
          </RippleButton>
        </div>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  fontFamily: "'Lora',serif",
  fontSize: "10px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "rgba(100,55,20,.5)",
  marginBottom: "6px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  fontFamily: "'Lora',serif",
  fontSize: "13px",
  background: "rgba(120,70,20,.06)",
  border: "1px solid rgba(120,70,20,.2)",
  borderRadius: "4px",
  padding: "10px 12px",
  outline: "none",
  color: "rgba(35,14,3,.8)",
  marginBottom: "16px",
};

const cancelBtn: CSSProperties = {
  fontFamily: "'Lora',serif",
  fontSize: "11px",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  background: "transparent",
  color: "rgba(100,55,20,.55)",
  border: "1px solid rgba(120,70,20,.22)",
  padding: "8px 18px",
  borderRadius: "3px",
  cursor: "pointer",
};

const submitBtn: CSSProperties = {
  fontFamily: "'Lora',serif",
  fontSize: "11px",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  background: "rgba(90,40,10,.82)",
  color: "rgba(255,215,150,.92)",
  border: "none",
  padding: "8px 20px",
  borderRadius: "3px",
  cursor: "pointer",
};
