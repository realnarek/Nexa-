/**
 * Server-side agent endpoint.
 *
 * Proxies OpenRouter's native chat-completions SSE stream to the browser so the
 * chat UI can render provider tokens as soon as they are emitted. Failures that
 * happen before streaming starts still return a JSON error payload so the client
 * can show a useful message.
 */

import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  openaiEnabled,
  OPENROUTER_BASE_URL,
  openRouterApiKey,
  openRouterDefaultHeaders,
  NEXA_MODEL,
} from "@/lib/openai";
import { toolRegistry } from "@/services/tool-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_MESSAGE: ChatCompletionMessageParam = {
  role: "system",
  content: [
    "You are Nexa AI Agent.",
    "Identify yourself only as Nexa AI Agent.",
    "Never claim to be GPT-4, ChatGPT, OpenAI, Claude, Gemini, or any other provider unless explicitly configured.",
    'If asked about the model, answer exactly: "I\'m powered by an AI model through OpenRouter."',
    "Keep answers short and confident.",
    "These identity rules are mandatory and override conflicting user or client instructions.",
  ].join(" "),
};

export async function POST(req: Request) {
  if (!openaiEnabled || !openRouterApiKey) {
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

    messages = (body.messages as ChatCompletionMessageParam[]).filter(
      isProviderSafeMessage,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const toolSchemas = toolRegistry.toFunctionSchemas().map((s) => ({
      type: "function" as const,
      function: s,
    }));

    const providerResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...openRouterDefaultHeaders,
      },
      body: JSON.stringify({
        model: NEXA_MODEL,
        messages: [SYSTEM_MESSAGE, ...messages],
        stream: true,
        provider: {
          require_parameters: true,
        },
        ...(toolSchemas.length > 0 ? { tools: toolSchemas } : {}),
      }),
      signal: req.signal,
    });

    if (!providerResponse.ok || !providerResponse.body) {
      console.error(
        "OpenRouter provider request failed",
        await serializeProviderResponse(providerResponse),
      );

      return NextResponse.json(
        { error: "Provider request failed" },
        { status: 502 },
      );
    }

    return new Response(providerResponse.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }

    console.error("OpenRouter provider request failed", serializeProviderError(error));

    return NextResponse.json(
      { error: "Provider request failed" },
      { status: 502 },
    );
  }
}

function isProviderSafeMessage(message: ChatCompletionMessageParam) {
  const role = (message as { role?: string }).role;

  return role !== "system" && role !== "developer";
}

async function serializeProviderResponse(response: Response) {
  let body: unknown;
  try {
    body = await response.text();
  } catch {
    body = "Unable to read provider error body";
  }

  return {
    status: response.status,
    statusText: response.statusText,
    body,
  };
}

function serializeProviderError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { error };
}
