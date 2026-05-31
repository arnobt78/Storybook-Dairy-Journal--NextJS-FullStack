/**
 * Server-only: demo credential picker on login (showcase / demos).
 * Enabled by default in all environments; set SHOW_DEMO_LOGIN=false to hide.
 */
export function isDemoLoginEnabled(): boolean {
  const flag = process.env.SHOW_DEMO_LOGIN?.trim().toLowerCase();
  if (flag === "false") return false;
  return true;
}
