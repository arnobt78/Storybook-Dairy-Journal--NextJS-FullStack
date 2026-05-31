/**
 * Server-only: demo credential picker on login.
 * On by default in development; production requires SHOW_DEMO_LOGIN=true.
 */
export function isDemoLoginEnabled(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.SHOW_DEMO_LOGIN?.trim().toLowerCase() === "true";
}
