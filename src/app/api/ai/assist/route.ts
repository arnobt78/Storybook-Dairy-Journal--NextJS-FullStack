import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * POST /api/ai/assist
 *
 * Server-side proxy for Anthropic Claude API so the ANTHROPIC_API_KEY
 * environment variable never reaches the browser bundle.
 *
 * Request body: { title: string; content: string; mood: string }
 * Response:     { text: string } | { error: string }
 *
 * Falls back gracefully when ANTHROPIC_API_KEY is not set — returns a
 * placeholder so the UI stays functional even in development without a key.
 */
export async function POST(req: NextRequest) {
  /* Auth guard — only signed-in users may call the AI */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, mood } = (await req.json()) as {
    title?: string;
    content?: string;
    mood?: string;
  };

  if (!content?.trim()) {
    return NextResponse.json({ error: "No content to continue" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    /* Dev mode: echo a placeholder so the button is testable without a key */
    return NextResponse.json({
      text: "\n\nThe words came slowly at first, then all at once — as they always do when truth finds its way through.",
    });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `You are a poetic journal writing assistant. Continue this personal diary entry with 2-3 sentences that match the voice and mood (${mood ?? "✨"}). Be literary, warm, introspective. Write only the continuation — no preamble, no quotation marks, no explanation.\n\nTitle: "${title ?? ""}"\nCurrent text: "${content}"\n\nContinue:`,
        }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}`);

    const data = await res.json() as { content?: { text?: string }[] };
    const text = data.content?.map(b => b.text ?? "").join("") ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[AI assist]", err);
    return NextResponse.json({ error: "AI assist failed" }, { status: 502 });
  }
}
