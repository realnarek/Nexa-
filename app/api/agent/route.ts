/**
 * Server-side agent endpoint.
 *
 * The chat frontend calls this route and expects a JSON response every time.
 * Successful provider calls return the raw OpenAI/OpenRouter completion object;
 * failures return a JSON error payload so the client never crashes parsing an
 * empty response body.
 */

import { NextResponse } from "next/server";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { openai, openaiEnabled, NEXA_MODEL } from "@/lib/openai";
import { toolRegistry } from "@/services/tool-registry";

export const runtime = "nodejs";

const JSON_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "nexa_assistant_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The assistant response text to show to the user.",
        },
      },
      required: ["content"],
      additionalProperties: false,
    },
  },
} as const;

const JSON_SYSTEM_MESSAGE: ChatCompletionMessageParam = {
  role: "system",
  content:
    "You are Nexa, a helpful AI automation assistant. Return only valid JSON that matches the requested schema.",
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

    const completionRequest: ChatCompletionCreateParamsNonStreaming = {
      model: NEXA_MODEL,
      messages: [JSON_SYSTEM_MESSAGE, ...messages],
      stream: false,
      response_format: JSON_RESPONSE_FORMAT,
      provider: {
        require_parameters: true,
      },
    } as ChatCompletionCreateParamsNonStreaming;

    if (toolSchemas.length > 0) {
      completionRequest.tools = toolSchemas;
    }

    const completion = await openai.chat.completions.create(completionRequest);
    const normalizedCompletion = normalizeJsonContent(completion);

    return NextResponse.json(normalizedCompletion);
  } catch (error) {
    console.error("OpenRouter provider request failed", serializeProviderError(error));

    return NextResponse.json(
      { error: "Provider request failed" },
      { status: 502 },
    );
  }
}

function normalizeJsonContent(completion: ChatCompletion): ChatCompletion {
  const content = completion.choices[0]?.message.content;

  if (typeof content !== "string") {
    throw new Error("OpenRouter response did not include assistant JSON content.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error("OpenRouter response content was not valid JSON.", {
      cause: error,
    });
  }

  if (!isNexaAssistantResponse(parsed)) {
    throw new Error("OpenRouter response JSON did not match the expected schema.");
  }

  return {
    ...completion,
    choices: completion.choices.map((choice, index) =>
      index === 0
        ? {
            ...choice,
            message: {
              ...choice.message,
              content: parsed.content,
            },
          }
        : choice,
    ),
  };
}

function isNexaAssistantResponse(value: unknown): value is { content: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "content" in value &&
    typeof value.content === "string"
  );
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
