/**
 * Server-side post-mutation hook — publish realtime event after Prisma write.
 * Client tabs receive via SSE and invalidate journalSubtree.
 */
import {
  publishJournalEvent,
  type JournalSyncEventType,
} from "@/lib/journal-pubsub";

export async function afterJournalMutation(
  userId: string,
  type: JournalSyncEventType,
  ids?: { bookId?: string; entryId?: string },
): Promise<void> {
  await publishJournalEvent(userId, {
    type,
    bookId: ids?.bookId,
    entryId: ids?.entryId,
  });
}
