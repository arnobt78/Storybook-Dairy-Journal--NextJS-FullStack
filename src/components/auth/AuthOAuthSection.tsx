"use client";

/**
 * Shared OAuth block for login/register — Google first, then optional "or" divider
 * before the credential form so the button stays visible above the fold on auth pages.
 */
import { AuthOrSeparator } from "@/components/auth/AuthOrSeparator";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

type AuthOAuthSectionProps = {
  googleEnabled: boolean;
  disabled?: boolean;
  /** Login vs register copy on the Google CTA */
  variant?: "login" | "register";
};

export function AuthOAuthSection({
  googleEnabled,
  disabled = false,
  variant = "login",
}: AuthOAuthSectionProps) {
  if (!googleEnabled) return null;

  const label =
    variant === "register" ? "Continue with Gmail" : "Open with Gmail";

  return (
    <div style={{ marginBottom: "18px" }}>
      <GoogleSignInButton disabled={disabled} label={label} />
      <AuthOrSeparator label="or" />
    </div>
  );
}
