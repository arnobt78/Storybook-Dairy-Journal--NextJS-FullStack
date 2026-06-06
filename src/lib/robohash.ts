/**
 * Robohash avatar URLs — deterministic robot portraits from any seed string.
 * Used in dashboard nav, login demo picker, and anywhere a fallback avatar is needed.
 */
export function robohashUrl(seed: string, size = 80): string {
  return `https://robohash.org/${encodeURIComponent(seed)}?set=set1&size=${size}x${size}`;
}
