/**
 * SSR auth page flags — shared by /login and /register (force-dynamic pages).
 */
import { isDemoLoginEnabled } from "@/lib/auth/is-demo-login-enabled";
import { isGoogleOAuthEnabled } from "@/lib/auth/is-google-enabled";

export type AuthPageConfig = {
  googleEnabled: boolean;
  /** Dev-only demo picker unless SHOW_DEMO_LOGIN=true in production */
  demoLoginEnabled: boolean;
};

export function getAuthPageConfig(): AuthPageConfig {
  return {
    googleEnabled: isGoogleOAuthEnabled(),
    demoLoginEnabled: isDemoLoginEnabled(),
  };
}
