/**
 * SSR auth page flags — shared by /login and /register (force-dynamic pages).
 */
import { isDemoLoginEnabled } from "@/lib/auth/is-demo-login-enabled";
import { isGoogleOAuthEnabled } from "@/lib/auth/is-google-enabled";

export type AuthPageConfig = {
  googleEnabled: boolean;
  /** Demo picker on by default; set SHOW_DEMO_LOGIN=false to hide */
  demoLoginEnabled: boolean;
};

export function getAuthPageConfig(): AuthPageConfig {
  return {
    googleEnabled: isGoogleOAuthEnabled(),
    demoLoginEnabled: isDemoLoginEnabled(),
  };
}
