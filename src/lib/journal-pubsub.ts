/**
 * Journal realtime events — Redis pub/sub channel per userId.
 * SSE route subscribes; API routes publish after mutations.
 */
import { getRedis } from "@/lib/redis";

export type JournalSyncEventType =
  | "entry_updated"
  | "entry_created"
  | "entry_deleted"
  | "book_updated"
  | "book_created"
  | "book_deleted";

export type JournalSyncEvent = {
  type: JournalSyncEventType;
  bookId?: string;
  entryId?: string;
  at: number;
};

export function journalChannel(userId: string): string {
  return `journal:events:${userId}`;
}

/** Fire-and-forget publish; also push to list for SSE poll fallback. */
export async function publishJournalEvent(
  userId: string,
  event: Omit<JournalSyncEvent, "at">,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const payload: JournalSyncEvent = { ...event, at: Date.now() };
  const channel = journalChannel(userId);
  const serialized = JSON.stringify(payload);

  try {
    await redis.publish(channel, serialized);
    const listKey = `${channel}:buffer`;
    await redis.lpush(listKey, serialized);
    await redis.ltrim(listKey, 0, 49);
    await redis.expire(listKey, 300);
  } catch {
    /* non-blocking — client invalidation still runs on mutating tab */
  }
}
