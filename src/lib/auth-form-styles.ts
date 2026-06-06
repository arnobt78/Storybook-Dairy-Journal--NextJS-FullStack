/**
 * Shared inline styles for login/register forms — keeps control heights and
 * CTA shapes consistent across credential fields, demo picker, and OAuth row.
 */
import type { CSSProperties } from "react";

/** Matches `.auth-control` in globals.css — same height as email/password inputs */
export const AUTH_CONTROL_HEIGHT = "var(--auth-control-h, 42px)";

export const inputStyle: CSSProperties = {
  width: "100%",
  fontFamily: "'Lora', serif",
  fontSize: "13px",
  background: "rgba(120,70,20,.06)",
  border: "1px solid rgba(120,70,20,.22)",
  borderRadius: "4px",
  padding: "10px 12px",
  outline: "none",
  color: "rgba(35,14,3,.8)",
  boxSizing: "border-box",
  minHeight: AUTH_CONTROL_HEIGHT,
};

/** Demo picker trigger — same visual height as credential inputs */
export const authControlStyle: CSSProperties = {
  width: "100%",
  fontFamily: "'Lora', serif",
  fontSize: "13px",
  background: "rgba(120,70,20,.08)",
  color: "rgba(100,55,20,.65)",
  border: "1px solid rgba(120,70,20,.2)",
  borderRadius: "4px",
  padding: "10px 12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  boxSizing: "border-box",
  minHeight: AUTH_CONTROL_HEIGHT,
};

export const primaryCtaStyle: CSSProperties = {
  width: "100%",
  fontFamily: "'Lora', serif",
  fontSize: "11px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  background: "rgba(90,40,10,.88)",
  color: "rgba(255,215,150,.92)",
  border: "none",
  padding: "12px",
  borderRadius: "4px",
  cursor: "pointer",
  boxShadow: "0 2px 10px rgba(0,0,0,.2)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  boxSizing: "border-box",
  minHeight: AUTH_CONTROL_HEIGHT,
};

export const outlineCtaStyle: CSSProperties = {
  width: "100%",
  fontFamily: "'Lora', serif",
  fontSize: "11px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  background: "rgba(120,70,20,.06)",
  color: "rgba(100,55,20,.7)",
  border: "1px solid rgba(120,70,20,.22)",
  padding: "11px 14px",
  borderRadius: "4px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  boxSizing: "border-box",
  minHeight: AUTH_CONTROL_HEIGHT,
};

export const fieldLabelStyle: CSSProperties = {
  display: "block",
  fontFamily: "'Lora', serif",
  fontSize: "10px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "rgba(100,55,20,.55)",
  marginBottom: "6px",
};
