"use client";

/**
 * LoginForm — credential sign-in with:
 *  • Demo picker (showcase): portaled menu for test@user.com — on by default;
 *    set SHOW_DEMO_LOGIN=false on server to hide in production.
 *  • Full validation feedback inline (no page reload).
 *  • Clears TanStack Query cache before entering dashboard so stale book data
 *    from a previous session never leaks through.
 *
 * ── WALKTHROUGH: auth form flow ──
 *  1. User submits email/password → NextAuth `signIn("credentials")`.
 *  2. On success: toast, invalidate `journalSubtree`, push `/dashboard`.
 *  3. Optional demo picker portaled to `document.body` (avoids auth shell clip).
 *  4. `AuthOAuthSection` below primary CTA adds Google OAuth when env vars set.
 */
import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronDown } from "lucide-react";
import { appToast } from "@/lib/app-toast";
import { notifyJournalCacheUpdated } from "@/lib/journal-cache-notify";
import {
  authControlClassName,
  authControlStyle,
  fieldLabelStyle,
  inputClassName,
  inputStyle,
  primaryCtaClassName,
  primaryCtaStyle,
} from "@/lib/auth-form-styles";
import { AuthOAuthSection } from "@/components/auth/AuthOAuthSection";
import { DemoAccountMenuRow } from "@/components/auth/DemoAccountMenuRow";
import { RippleButton } from "@/components/ui/ripple-button";
import { AvatarRing } from "@/components/ui/AvatarRing";
import { TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_PASSWORD } from "@/constants/auth";

/** Test account seeded in the database for demos — matches api/auth/register seed logic */
const TEST_EMAIL = TEST_ACCOUNT_EMAIL;
const TEST_PASS = TEST_ACCOUNT_PASSWORD;

type LoginFormProps = {
  /** From server: true when GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set */
  googleEnabled?: boolean;
  /** From server: demo picker on unless SHOW_DEMO_LOGIN=false */
  demoLoginEnabled?: boolean;
};

export function LoginForm({ googleEnabled = false, demoLoginEnabled = false }: LoginFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showTestMenu, setShowTestMenu] = useState(false);
  /** Viewport-anchored box for the demo menu — updated while open on resize/scroll. */
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const demoTriggerRef = useRef<HTMLButtonElement>(null);

  const hasCredentials = Boolean(form.email.trim() || form.password.trim());

  const fillTestCredentials = () => {
    setForm({ email: TEST_EMAIL, password: TEST_PASS });
    setShowTestMenu(false);
    setMenuBox(null);
    setError("");
  };

  /** Clears email/password only — enabled when fields have content */
  const clearCredentialFields = () => {
    if (!hasCredentials) return;
    setForm({ email: "", password: "" });
    setShowTestMenu(false);
    setMenuBox(null);
    setError("");
  };

  /**
   * Keeps the fixed demo panel under the trigger while the auth shell scrolls or
   * the viewport resizes; capture-phase scroll catches nested scroll containers.
   */
  useLayoutEffect(() => {
    if (!showTestMenu || !demoTriggerRef.current) {
      setMenuBox(null);
      return;
    }
    const el = demoTriggerRef.current;
    const sync = () => {
      const r = el.getBoundingClientRect();
      setMenuBox({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [showTestMenu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
      } else {
        const displayName = form.email.split("@")[0] || "Reader";
        appToast.auth.welcomeBack(displayName);
        /* Drop stale journal payloads from any prior session (shelf + every open book cache). */
        await notifyJournalCacheUpdated(queryClient);
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form-stagger">
      {demoLoginEnabled && (
        <div style={{ position: "relative", zIndex: 40, marginBottom: "12px" }} className="auth-field-compact">
          <p style={{ ...fieldLabelStyle, margin: "0 0 8px" }}>Test Account To Login With</p>
          <RippleButton
            ref={demoTriggerRef}
            type="button"
            className={`w-full ${authControlClassName}`}
            onClick={() => setShowTestMenu((v) => !v)}
            style={authControlStyle}
          >
            <span>Select Demo Account</span>
            <ChevronDown size={14} aria-hidden className="shrink-0 opacity-60" />
          </RippleButton>
          {showTestMenu &&
            menuBox &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                role="listbox"
                aria-label="Demo account actions"
                className="leather-glass-panel overflow-hidden"
                style={{
                  position: "fixed",
                  top: menuBox.top,
                  left: menuBox.left,
                  width: menuBox.width,
                  zIndex: 9999,
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              >
                <DemoAccountMenuRow onClick={fillTestCredentials} withBorderBottom>
                  <AvatarRing seed={TEST_EMAIL} size={28} unoptimized />
                  <span className="demo-menu-row__inline" style={{ fontSize: "12px" }}>
                    <strong>Test User</strong>
                    <span className="demo-menu-row__sep" aria-hidden>
                      ·
                    </span>
                    <span style={{ opacity: 0.65, fontSize: "11px" }}>{TEST_EMAIL}</span>
                  </span>
                </DemoAccountMenuRow>
                <DemoAccountMenuRow
                  disabled={!hasCredentials}
                  onClick={clearCredentialFields}
                  className="uppercase tracking-wide"
                  style={{ fontSize: "11px", letterSpacing: "1px", color: "rgba(100,55,20,.55)" }}
                >
                  Clear Section
                </DemoAccountMenuRow>
              </div>,
              document.body,
            )}
        </div>
      )}

      <Field label="Email">
        <input
          type="email"
          required
          className={inputClassName}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com"
          style={inputStyle}
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          required
          className={inputClassName}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="••••••••"
          style={inputStyle}
        />
      </Field>

      {error && (
        <p style={{ fontFamily: "'Lora',serif", fontSize: "12px", color: "#c0392b", margin: "0 0 12px" }}>
          {error}
        </p>
      )}

      <RippleButton
        type="submit"
        disabled={loading}
        icon={BookOpen}
        shine
        shineRadius={4}
        className={`w-full ${primaryCtaClassName}`}
        style={{
          ...primaryCtaStyle,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Opening…" : "Open My Journal"}
      </RippleButton>

      <AuthOAuthSection googleEnabled={!!googleEnabled} disabled={loading} variant="login" />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="auth-field" style={{ marginBottom: "12px" }}>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}
