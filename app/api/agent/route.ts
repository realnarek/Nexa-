/**
 * Optional server-side agent endpoint.
 *
 * The demo client uses the in-process mock orchestrator in
 * `services/agent.service.ts`. This route exists so the architecture is
 * ready to swap in a real LLM tool-calling loop without UI changes.
 *
 * Wire it up by setting OPENAI_API_KEY in .env.local and pointing the
 * chat store at `/api/agent` instead of the local orchestrator.
 */

import { NextResponse } from "next/server";
import { openai, openaiEnabled, NEXA_MODEL } from "@/lib/openai";
import { toolRegistry } from "@/services/tool-registry";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!openaiEnabled || !openai) {
    return NextResponse.json(
      { error: "Demo mode — set OPENAI_API_KEY in .env.local to enable live agent." },
      { status: 503 },
    );
  }

  const { messages } = await req.json();

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
}
