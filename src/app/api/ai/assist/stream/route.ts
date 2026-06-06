/**
 * POST /api/ai/assist/stream — SSE token stream (Groq → OpenRouter → Anthropic).
 */
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { aiAssistRequestSchema, buildAssistPrompt } from "@/lib/ai-assist";
import { consumeAiRateLimit } from "@/lib/ai-rate-limit";
import { streamAssistCompletion } from "@/lib/ai-provider";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const parsed = aiAssistRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? "Invalid request" }),
      { status: 400 },
    );
  }

  const rate = await consumeAiRateLimit(session.user.id, parsed.data.assistSessionId);
  if (!rate.ok) {
    return new Response(
      JSON.stringify({ error: `Rate limit exceeded — try again in ${rate.retryAfterSec}s` }),
      { status: 429 },
    );
  }

  const encoder = new TextEncoder();
  const prompt = buildAssistPrompt(parsed.data);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, string | boolean>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for await (const chunk of streamAssistCompletion(prompt)) {
          if (chunk.error) {
            send({ error: chunk.error });
            break;
          }
          if (chunk.usedFallback) send({ usedFallback: true });
          if (chunk.text) send({ text: chunk.text });
          if (chunk.done) send({ done: "true" });
        }
      } catch (err) {
        console.error("[AI assist stream]", err);
        send({ error: "AI assist failed" });
      }

      controller.close();
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
