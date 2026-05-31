/**
 * Single source of truth for Google OAuth env vars.
 * Accepts canonical names (GOOGLE_CLIENT_*) and legacy aliases (GOOGLE_ID / GOOGLE_SECRET)
 * so local .env files match either convention without breaking the provider or UI gate.
 */
export type GoogleOAuthEnv = {
  clientId: string | undefined;
  clientSecret: string | undefined;
  enabled: boolean;
};

export function getGoogleOAuthEnv(): GoogleOAuthEnv {
  const clientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_ID?.trim() ||
    undefined;

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_SECRET?.trim() ||
    undefined;

  return {
    clientId,
    clientSecret,
    enabled: Boolean(clientId && clientSecret),
  };
}
