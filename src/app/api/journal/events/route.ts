/**
 * GET /api/journal/events — SSE stream of journal mutations (Redis list poll).
 * Upstash REST has no blocking SUBSCRIBE; we poll the per-user event buffer.
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getRedis } from "@/lib/redis";
import { journalChannel, type JournalSyncEvent } from "@/lib/journal-pubsub";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  const listKey = `${journalChannel(userId)}:buffer`;

  const stream = new ReadableStream({
    start(controller) {
      let lastSeen = Date.now();
      let closed = false;

      const send = (data: object) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const heartbeat = setInterval(() => {
        send({ heartbeat: true });
      }, 25000);

      const poll = async () => {
        while (!closed) {
          const redis = getRedis();
          if (redis) {
            try {
              const raw = await redis.lrange<string>(listKey, 0, 19);
              for (const item of [...raw].reverse()) {
                const ev = JSON.parse(item) as JournalSyncEvent;
                if (ev.at > lastSeen) {
                  send(ev);
                  lastSeen = ev.at;
                }
              }
            } catch {
              /* retry on next tick */
            }
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
      };

      void poll();

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      /* client disconnected */
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
