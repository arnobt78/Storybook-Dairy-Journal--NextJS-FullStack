"use client";

/**
 * LoginForm — credential sign-in with:
 *  • Demo picker: portaled menu lists `Test User (test@user.com)` to fill seeded
 *    credentials and `Clear Section` to reset fields; `createPortal` + `position: fixed`
 *    from `getBoundingClientRect()` avoids transform/overflow issues from the auth shell.
 *  • Full validation feedback inline (no page reload).
 *  • Clears TanStack Query cache before entering dashboard so stale book data
 *    from a previous session never leaks through.
 */
import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

/** Test account seeded in the database for demos — matches api/auth/register seed logic */
const TEST_EMAIL = "test@user.com";
const TEST_PASS  = "12345678";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showTestMenu, setShowTestMenu] = useState(false);
  /** Viewport-anchored box for the demo menu — updated while open on resize/scroll. */
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const demoTriggerRef = useRef<HTMLButtonElement>(null);

  const fillTestCredentials = () => {
    setForm({ email: TEST_EMAIL, password: TEST_PASS });
    setShowTestMenu(false);
    setMenuBox(null);
    setError("");
  };

  /** Clears email/password only — leaves other form state untouched. */
  const clearCredentialFields = () => {
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
        email:    form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
      } else {
        toast.success("Welcome back!");
        /* Drop stale journal payloads from any prior session (shelf + every open book cache). */
        await queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() });
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
      {/* Demo block: section title + full-width trigger; portaled menu lists fill + clear rows. */}
      <div style={{ position: "relative", zIndex: 40, marginBottom: "18px" }}>
        <p
          style={{
            fontFamily: "'Lora',serif",
            fontSize: "10px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "rgba(100,55,20,.55)",
            margin: "0 0 8px",
          }}
        >
          Test Account To Login With
        </p>
        <button
          ref={demoTriggerRef}
          type="button"
          className="w-full"
          onClick={() => setShowTestMenu((v) => !v)}
          style={{
            fontFamily: "'Lora',serif", fontSize: "10px", letterSpacing: "1.5px",
            textTransform: "uppercase", background: "rgba(120,70,20,.08)",
            color: "rgba(100,55,20,.65)", border: "1px solid rgba(120,70,20,.2)",
            padding: "8px 14px", borderRadius: "3px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            width: "100%", boxSizing: "border-box",
          }}
        >
          Select Demo Account ▾
        </button>
        {showTestMenu &&
          menuBox &&
          typeof document !== "undefined" &&
          createPortal(
          <div
            role="listbox"
            aria-label="Demo account actions"
            style={{
              position: "fixed",
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
              zIndex: 9999,
              background: "rgba(244,236,218,.98)", border: "1px solid rgba(120,70,20,.2)",
              borderRadius: "4px", boxShadow: "0 8px 24px rgba(0,0,0,.18)",
              overflow: "hidden", boxSizing: "border-box",
            }}
          >
            <button
              type="button"
              onClick={fillTestCredentials}
              style={{
                display: "block", width: "100%", textAlign: "left",
                fontFamily: "'Lora',serif", fontSize: "12px",
                color: "rgba(35,14,3,.8)", padding: "10px 14px",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: "1px solid rgba(120,70,20,.1)", boxSizing: "border-box",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(120,70,20,.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              Test User ({TEST_EMAIL})
            </button>
            <button
              type="button"
              onClick={clearCredentialFields}
              style={{
                display: "block", width: "100%", textAlign: "left",
                fontFamily: "'Lora',serif", fontSize: "11px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "rgba(100,55,20,.55)",
                padding: "10px 14px",
                background: "none", border: "none", cursor: "pointer",
                boxSizing: "border-box",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(120,70,20,.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              Clear Section
            </button>
          </div>,
          document.body
        )}
      </div>

      <Field label="Email">
        <input
          type="email" required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com"
          style={inputStyle}
        />
      </Field>
      <Field label="Password">
        <input
          type="password" required
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="••••••••"
          style={inputStyle}
        />
      </Field>

      {error && (
        <p style={{ fontFamily: "'Lora',serif", fontSize: "12px", color: "#c0392b", marginBottom: "12px", margin: "0 0 12px" }}>
          {error}
        </p>
      )}

      <button
        type="submit" disabled={loading}
        style={{
          width: "100%", fontFamily: "'Lora',serif", fontSize: "11px",
          letterSpacing: "2px", textTransform: "uppercase",
          background: "rgba(90,40,10,.88)", color: "rgba(255,215,150,.92)",
          border: "none", padding: "12px", borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1, boxShadow: "0 2px 10px rgba(0,0,0,.2)",
        }}
      >
        {loading ? "Opening…" : "Open My Journal"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{
        display: "block", fontFamily: "'Lora',serif", fontSize: "10px",
        letterSpacing: "2px", textTransform: "uppercase",
        color: "rgba(100,55,20,.55)", marginBottom: "6px",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", fontFamily: "'Lora',serif", fontSize: "13px",
  background: "rgba(120,70,20,.06)", border: "1px solid rgba(120,70,20,.22)",
  borderRadius: "4px", padding: "10px 12px", outline: "none",
  color: "rgba(35,14,3,.8)",
};
