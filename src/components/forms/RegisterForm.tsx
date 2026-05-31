"use client";

/**
 * RegisterForm — email/password sign-up with optional Google OAuth (same env gate as login).
 * Invalidates journalSubtree after success so dashboard loads fresh shelves for the new user.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

import { AuthOAuthSection } from "@/components/auth/AuthOAuthSection";

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
      // Auto sign in
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      toast.success("Your journal is ready!");
      /* New user: refresh every journal-scoped query so dashboard + reader never reuse old cache. */
      await queryClient.invalidateQueries({ queryKey: queryKeys.journalSubtree() });
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
      <AuthOAuthSection
        googleEnabled={!!googleEnabled}
        disabled={loading}
        variant="register"
      />

      <Field label="Your Name">
        <input
          type="text"
          required
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
          placeholder="Jane Doe"
          style={inputStyle}
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          required
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com"
          style={inputStyle}
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="At least 8 characters"
          style={inputStyle}
        />
      </Field>
      {error && (
        <p style={{ fontFamily: "'Lora',serif", fontSize: "12px", color: "#c0392b", marginBottom: "12px" }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          fontFamily: "'Lora',serif",
          fontSize: "11px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          background: "rgba(90,40,10,.88)",
          color: "rgba(255,215,150,.92)",
          border: "none",
          padding: "12px",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          boxShadow: "0 2px 10px rgba(0,0,0,.2)",
        }}
      >
        {loading ? "Creating your journal…" : "Begin My Story"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontFamily: "'Lora',serif", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(100,55,20,.55)", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "'Lora',serif",
  fontSize: "13px",
  background: "rgba(120,70,20,.06)",
  border: "1px solid rgba(120,70,20,.22)",
  borderRadius: "4px",
  padding: "10px 12px",
  outline: "none",
  color: "rgba(35,14,3,.8)",
};
