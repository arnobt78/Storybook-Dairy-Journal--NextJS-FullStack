/**
 * SSR auth page flags — shared by /login and /register (force-dynamic pages).
 */
import { isGoogleOAuthEnabled } from "@/lib/auth/is-google-enabled";

export type AuthPageConfig = {
  googleEnabled: boolean;
};

export function getAuthPageConfig(): AuthPageConfig {
  return {
    googleEnabled: isGoogleOAuthEnabled(),
  };
}
