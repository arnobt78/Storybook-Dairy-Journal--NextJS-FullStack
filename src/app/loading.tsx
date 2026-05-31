/**
 * Root `loading.tsx` previously rendered a full-screen “OPENING YOUR JOURNAL…”
 * panel on every segment transition, which read as an extra fallback flash
 * between the landing cover animation and `/login` / `/register`.
 * Returning `null` keeps the shell visible while RSC streams (no duplicate bg).
 */
export default function Loading() {
  return null;
}
