/**
 * AI assist provider chain: Groq (free tier) → OpenRouter fallback.
 * OpenAI-compatible chat completions API; Anthropic env kept as legacy optional path.
 */
import { DEV_PLACEHOLDER } from "@/lib/ai-assist";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

export type AiProviderResult = {
  text: string;
  provider: "groq" | "openrouter" | "placeholder" | "anthropic";
  usedFallback: boolean;
};

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

async function chatCompletion(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  extraHeaders?: Record<string, string>,
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 300,
      temperature: 0.7,
    }),
  });
}

async function parseChatJson(res: Response): Promise<string> {
  if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

/** Legacy Anthropic path when only ANTHROPIC_API_KEY is set. */
async function anthropicSync(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No Anthropic key");

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
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.map((b) => b.text ?? "").join("") ?? "";
}

export async function syncAssistCompletion(prompt: string): Promise<AiProviderResult> {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!groqKey && !openRouterKey && !process.env.ANTHROPIC_API_KEY) {
    return { text: DEV_PLACEHOLDER, provider: "placeholder", usedFallback: false };
  }

  if (groqKey) {
    try {
      const res = await chatCompletion(GROQ_URL, groqKey, GROQ_MODEL, [
        { role: "user", content: prompt },
      ]);
      const text = await parseChatJson(res);
      if (text) return { text, provider: "groq", usedFallback: false };
    } catch {
      /* fall through to OpenRouter */
    }
  }

  if (openRouterKey) {
    const res = await chatCompletion(
      OPENROUTER_URL,
      openRouterKey,
      OPENROUTER_MODEL,
      [{ role: "user", content: prompt }],
      {
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "https://storybook-journal.vercel.app",
        "X-Title": "StoryBook Journal",
      },
    );
    const text = await parseChatJson(res);
    if (text) {
      return { text, provider: "openrouter", usedFallback: Boolean(groqKey) };
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const text = await anthropicSync(prompt);
    if (text) return { text, provider: "anthropic", usedFallback: true };
  }

  return { text: DEV_PLACEHOLDER, provider: "placeholder", usedFallback: true };
}

/** Stream tokens via Groq/OpenRouter OpenAI SSE format; yields text chunks. */
export async function* streamAssistCompletion(
  prompt: string,
): AsyncGenerator<{ text?: string; usedFallback?: boolean; done?: boolean; error?: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!groqKey && !openRouterKey && !process.env.ANTHROPIC_API_KEY) {
    yield { text: DEV_PLACEHOLDER };
    yield { done: true };
    return;
  }

  let res: Response | null = null;
  let usedFallback = false;

  if (groqKey) {
    try {
      res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          stream: true,
        }),
      });
      if (!res.ok || !res.body) res = null;
    } catch {
      res = null;
    }
  }

  if (!res && openRouterKey) {
    usedFallback = Boolean(groqKey);
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "https://storybook-journal.vercel.app",
        "X-Title": "StoryBook Journal",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        stream: true,
      }),
    });
  }

  if (!res?.ok || !res.body) {
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const text = await anthropicSync(prompt);
        yield { text, usedFallback: true };
        yield { done: true };
        return;
      } catch {
        yield { error: "AI assist failed" };
        return;
      }
    }
    yield { error: "AI assist failed" };
    return;
  }

  if (usedFallback) yield { usedFallback: true };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      try {
        const event = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const chunk = event.choices?.[0]?.delta?.content;
        if (chunk) yield { text: chunk };
      } catch {
        /* skip malformed SSE */
      }
    }
  }

  yield { done: true };
}
