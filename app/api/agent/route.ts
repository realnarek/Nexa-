/**
 * Server-side agent endpoint.
 *
 * The chat frontend calls this route and receives a streamed text response from
 * OpenRouter, allowing the UI to render assistant tokens as soon as they arrive.
 * Failures that happen before streaming starts still return a JSON error payload
 * so the client can show a useful message.
 */

import { NextResponse } from "next/server";
import type {
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { openai, openaiEnabled, NEXA_MODEL } from "@/lib/openai";
import { toolRegistry } from "@/services/tool-registry";

export const runtime = "nodejs";

const SYSTEM_MESSAGE: ChatCompletionMessageParam = {
  role: "system",
  content:
    "You are Nexa, a helpful AI automation assistant. Reply directly with concise, useful assistant text for the user.",
};

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
    const toolSchemas = toolRegistry.toFunctionSchemas().map((s) => ({
      type: "function" as const,
      function: s,
    }));

    const completionRequest: ChatCompletionCreateParamsStreaming = {
      model: NEXA_MODEL,
      messages: [SYSTEM_MESSAGE, ...messages],
      stream: true,
      provider: {
        require_parameters: true,
      },
    } as ChatCompletionCreateParamsStreaming;

    if (toolSchemas.length > 0) {
      completionRequest.tools = toolSchemas;
    }

    const completionStream = await openai.chat.completions.create(completionRequest);
    const encoder = new TextEncoder();

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completionStream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              controller.enqueue(encoder.encode(delta));
            }
          }
          controller.close();
        } catch (error) {
          console.error("OpenRouter provider stream failed", serializeProviderError(error));
          controller.error(error);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("OpenRouter provider request failed", serializeProviderError(error));

    return NextResponse.json(
      { error: "Provider request failed" },
      { status: 502 },
    );
  }
}

function serializeProviderError(error: unknown) {
  if (error instanceof Error) {
    const maybeOpenAiError = error as Error & {
      status?: number;
      code?: string;
      type?: string;
      param?: string;
      response?: { headers?: unknown };
      error?: unknown;
    };

    return {
      name: error.name,
      message: error.message,
      status: maybeOpenAiError.status,
      code: maybeOpenAiError.code,
      type: maybeOpenAiError.type,
      param: maybeOpenAiError.param,
      providerError: maybeOpenAiError.error,
      stack: error.stack,
    };
  }

  return { error };
}
