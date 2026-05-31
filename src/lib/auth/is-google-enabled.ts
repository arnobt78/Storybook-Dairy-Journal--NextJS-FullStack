/**
 * Server-only check: Google OAuth UI + NextAuth provider when both env vars are set.
 * Reads canonical or legacy env names via `getGoogleOAuthEnv`.
 */
import { getGoogleOAuthEnv } from "@/lib/auth/google-oauth-env";

export function isGoogleOAuthEnabled(): boolean {
  return getGoogleOAuthEnv().enabled;
}
