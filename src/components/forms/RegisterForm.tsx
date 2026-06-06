"use client";

/**
 * RegisterForm — email/password sign-up with optional Google OAuth (same env gate as login).
 * Invalidates journalSubtree after success so dashboard loads fresh shelves for the new user.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { BookPlus } from "lucide-react";
import { appToast } from "@/lib/app-toast";
import { notifyJournalCacheUpdated } from "@/lib/journal-cache-notify";
import { fieldLabelStyle, inputStyle, primaryCtaStyle } from "@/lib/auth-form-styles";

import { AuthOAuthSection } from "@/components/auth/AuthOAuthSection";
import { RippleButton } from "@/components/ui/ripple-button";

type RegisterFormProps = {
  /** From server: true when Google OAuth env vars are set */
  googleEnabled?: boolean;
};

export function RegisterForm({ googleEnabled = false }: RegisterFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? "Registration failed");
        return;
      }
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      const name = form.displayName.trim() || form.email.split("@")[0] || "Writer";
      appToast.auth.registered(name);
      await notifyJournalCacheUpdated(queryClient);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form-stagger">
      <Field label="Your Name">
        <input
          type="text"
          required
          className="auth-control"
          value={form.displayName}
          onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          placeholder="Jane Doe"
          style={inputStyle}
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          required
          className="auth-control"
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
          minLength={8}
          className="auth-control"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="At least 8 characters"
          style={inputStyle}
        />
      </Field>
      {error && (
        <p style={{ fontFamily: "'Lora',serif", fontSize: "12px", color: "#c0392b", marginBottom: "12px" }}>
          {error}
        </p>
      )}
      <RippleButton
        type="submit"
        disabled={loading}
        icon={BookPlus}
        shine
        shineRadius={4}
        className="w-full"
        style={{
          ...primaryCtaStyle,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Creating your journal…" : "Begin My Story"}
      </RippleButton>

      <AuthOAuthSection googleEnabled={!!googleEnabled} disabled={loading} variant="register" />
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
