"use client";

/**
 * One-click Google OAuth via NextAuth.
 * Matches primary auth CTA height/radius for visual consistency on login/register.
 */
import { useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import { appToast } from "@/lib/app-toast";
import { outlineCtaStyle } from "@/lib/auth-form-styles";
import {
  AUTH_STATE_KEY,
  OAUTH_CALLBACK_URL,
  OAUTH_PENDING_KEY,
} from "@/constants/auth";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { RippleButton } from "@/components/ui/ripple-button";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  label?: string;
};

export function GoogleSignInButton({
  disabled = false,
  label = "Open with Gmail",
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STATE_KEY, "true");
        localStorage.setItem(OAUTH_PENDING_KEY, "true");
      }
      await signIn("google", {
        callbackUrl: OAUTH_CALLBACK_URL,
        redirect: true,
      });
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_STATE_KEY);
        localStorage.removeItem(OAUTH_PENDING_KEY);
      }
      appToast.auth.googleError();
      setLoading(false);
    }
  }, [disabled, loading]);

  return (
    <RippleButton
      type="button"
      disabled={disabled || loading}
      onClick={handleGoogleSignIn}
      aria-label={label}
      className="w-full auth-control"
      style={{
        ...outlineCtaStyle,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.65 : 1,
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = "rgba(120,70,20,.1)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(120,70,20,.06)";
      }}
    >
      <GoogleIcon size={18} />
      <span>{loading ? "Redirecting…" : label}</span>
    </RippleButton>
  );
}
