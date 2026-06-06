/**
 * AI rate limit — Upstash Redis sliding window with in-memory dev fallback.
 * assistSessionId dedupes stream + sync so one click = one slot.
 */
import { getRedis } from "@/lib/redis";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const SESSION_TTL_MS = 120_000;
const WINDOW_SEC = Math.ceil(WINDOW_MS / 1000);

const buckets = new Map<string, { count: number; resetAt: number }>();
const assistSessions = new Map<string, number>();

function pruneAssistSessions(now: number): void {
  for (const [key, expiresAt] of assistSessions) {
    if (now >= expiresAt) assistSessions.delete(key);
  }
}

function memoryConsume(
  userId: string,
  assistSessionId?: string | null,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  pruneAssistSessions(now);

  if (assistSessionId) {
    const sessionKey = `${userId}:${assistSessionId}`;
    const sessionExpires = assistSessions.get(sessionKey);
    if (sessionExpires && now < sessionExpires) {
      return { ok: true };
    }
  }

  const bucket = buckets.get(userId);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    if (assistSessionId) {
      assistSessions.set(`${userId}:${assistSessionId}`, now + SESSION_TTL_MS);
    }
    return { ok: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  if (assistSessionId) {
    assistSessions.set(`${userId}:${assistSessionId}`, now + SESSION_TTL_MS);
  }
  return { ok: true };
}

async function redisConsume(
  userId: string,
  assistSessionId?: string | null,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const redis = getRedis();
  if (!redis) return memoryConsume(userId, assistSessionId);

  const now = Date.now();
  const bucketKey = `ai:rl:${userId}`;

  if (assistSessionId) {
    const sessionKey = `ai:session:${userId}:${assistSessionId}`;
    const exists = await redis.get<number>(sessionKey);
    if (exists) return { ok: true };
  }

  const count = await redis.incr(bucketKey);
  if (count === 1) {
    await redis.expire(bucketKey, WINDOW_SEC);
  }

  if (count > MAX_REQUESTS) {
    const ttl = await redis.ttl(bucketKey);
    return { ok: false, retryAfterSec: ttl > 0 ? ttl : WINDOW_SEC };
  }

  if (assistSessionId) {
    const sessionKey = `ai:session:${userId}:${assistSessionId}`;
    await redis.set(sessionKey, 1, { ex: Math.ceil(SESSION_TTL_MS / 1000) });
  }

  return { ok: true };
}

export async function consumeAiRateLimit(
  userId: string,
  assistSessionId?: string | null,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  try {
    return await redisConsume(userId, assistSessionId);
  } catch {
    return memoryConsume(userId, assistSessionId);
  }
}
