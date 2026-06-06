/**
 * POST /api/ai/assist — sync JSON AI writing fallback.
 * Provider chain: Groq → OpenRouter → Anthropic (legacy) → placeholder.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  aiAssistRequestSchema,
  buildAssistPrompt,
  type AiAssistResponse,
} from "@/lib/ai-assist";
import { consumeAiRateLimit } from "@/lib/ai-rate-limit";
import { syncAssistCompletion } from "@/lib/ai-provider";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" } satisfies AiAssistResponse, {
      status: 401,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" } satisfies AiAssistResponse, {
      status: 400,
    });
  }

  const parsed = aiAssistRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" } satisfies AiAssistResponse,
      { status: 400 },
    );
  }

  const rate = await consumeAiRateLimit(session.user.id, parsed.data.assistSessionId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded — try again in ${rate.retryAfterSec}s` } satisfies AiAssistResponse,
      { status: 429 },
    );
  }

  try {
    const result = await syncAssistCompletion(buildAssistPrompt(parsed.data));
    return NextResponse.json({
      text: result.text,
      meta: { provider: result.provider, usedFallback: result.usedFallback },
    } satisfies AiAssistResponse & { meta?: object });
  } catch (err) {
    console.error("[AI assist]", err);
    return NextResponse.json({ error: "AI assist failed" } satisfies AiAssistResponse, {
      status: 502,
    });
  }
}
