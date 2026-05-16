/**
 * Server-side agent endpoint.
 *
 * The chat frontend calls this route and expects a JSON response every time.
 * Successful provider calls return the raw OpenAI/OpenRouter completion object;
 * failures return a JSON error payload so the client never crashes parsing an
 * empty response body.
 */

import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { openai, openaiEnabled, NEXA_MODEL } from "@/lib/openai";
import { toolRegistry } from "@/services/tool-registry";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!openaiEnabled || !openai) {
    return NextResponse.json(
      { error: "Demo mode — set OPENROUTER_API_KEY in .env.local to enable live agent." },
      { status: 503 },
    );
  }

  let messages: ChatCompletionMessageParam[];
  try {
    const body = (await req.json()) as { messages?: unknown };
    if (!Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    messages = body.messages as ChatCompletionMessageParam[];
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: NEXA_MODEL,
      messages,
      stream: false,
      tools: toolRegistry.toFunctionSchemas().map((s) => ({
        type: "function",
        function: s,
      })),
    });

    return NextResponse.json(completion);
  } catch {
    return NextResponse.json(
      { error: "Provider request failed" },
      { status: 502 },
    );
  }
}
