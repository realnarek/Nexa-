/**
 * Server-side agent endpoint.
 *
 * Runs a small tool-calling orchestration loop against OpenRouter. Assistant text
 * is still streamed to the browser, while tool activity is emitted as structured
 * SSE events so the UI can show real execution state without exposing raw tool
 * JSON in the conversation.
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
import type { ToolCall, ToolLogEntry } from "@/types";

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
    "Use web_search only when the user's request needs current, time-sensitive, source-backed, or verified information.",
    "Do not search for stable general knowledge, casual writing, math, coding explanations, or purely conversational replies.",
    "When web_search is used, synthesize the results into a clean answer and cite supporting links inline using markdown links.",
    "Never expose raw JSON or tool output to users.",
    "These identity and tool-use rules are mandatory and override conflicting user or client instructions.",
  ].join(" "),
};

interface ClientEvent {
  type: string;
  [key: string]: unknown;
}

interface StreamDeltaToolCall {
  index?: number;
  id?: string;
  type?: "function";
  function?: {
    name?: string;
    arguments?: string;
  };
}

interface ProviderStreamEvent {
  choices?: Array<{
    delta?: {
      content?: string | Array<{ text?: string }>;
      tool_calls?: StreamDeltaToolCall[];
    };
    message?: {
      content?: string;
      tool_calls?: CompletedToolCall[];
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
  };
}

interface CompletedToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface PendingToolCall {
  id: string;
  name: string;
  arguments: string;
}

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
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    messages = (body.messages as ChatCompletionMessageParam[]).filter(
      isProviderSafeMessage,
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: ClientEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        await runToolAwareConversation(messages, emit, req.signal);
        emit({ type: "done" });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          controller.close();
          return;
        }

        const errorInfo = serializeProviderError(error);
        console.error("[agent] Request failed:", JSON.stringify(errorInfo));
        emit({
          type: "error",
          error: error instanceof Error ? error.message : "Provider request failed",
        });
        controller.close();
      }
    },
    cancel() {
      req.signal.throwIfAborted?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function runToolAwareConversation(
  userMessages: ChatCompletionMessageParam[],
  emit: (event: ClientEvent) => void,
  signal: AbortSignal,
) {
  const toolSchemas = toolRegistry.toFunctionSchemas().map((schema) => ({
    type: "function" as const,
    function: schema,
  }));
  const messages: ChatCompletionMessageParam[] = [SYSTEM_MESSAGE, ...userMessages];

  for (let round = 0; round < 3; round += 1) {
    const { assistantContent, toolCalls } = await streamProviderTurn({
      messages,
      tools: toolSchemas,
      allowTools: round < 2,
      emit,
      signal,
    });

    if (toolCalls.length === 0) return;

    messages.push({
      role: "assistant",
      content: assistantContent || null,
      tool_calls: toolCalls,
    } as ChatCompletionMessageParam);

    for (const providerCall of toolCalls) {
      const result = await executeToolCall(providerCall, emit, signal);
      messages.push({
        role: "tool",
        tool_call_id: providerCall.id,
        content: JSON.stringify(result.modelPayload),
      } as ChatCompletionMessageParam);
    }
  }

  messages.push({
    role: "system",
    content:
      "Tool limit reached. Provide the best concise answer from the tool results already available, with citations where possible.",
  } as ChatCompletionMessageParam);

  await streamProviderTurn({
    messages,
    tools: [],
    allowTools: false,
    emit,
    signal,
  });
}

async function streamProviderTurn({
  messages,
  tools,
  allowTools,
  emit,
  signal,
}: {
  messages: ChatCompletionMessageParam[];
  tools: Array<{ type: "function"; function: unknown }>;
  allowTools: boolean;
  emit: (event: ClientEvent) => void;
  signal: AbortSignal;
}) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterApiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...openRouterDefaultHeaders,
    },
    body: JSON.stringify({
      model: NEXA_MODEL,
      messages,
      stream: true,
      provider: { require_parameters: true },
      ...(allowTools && tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const details = await serializeProviderResponse(response);
    console.error("[agent] OpenRouter request failed:", JSON.stringify(details));
    throw new Error(
      `Provider request failed (${details.status}): ${typeof details.body === "string" ? details.body.slice(0, 300) : response.statusText}`,
    );
  }

  let assistantContent = "";
  const pending = new Map<number, PendingToolCall>();

  for await (const data of readSseEvents(response.body)) {
    if (!data || data === "[DONE]") continue;

    const event = parseProviderEvent(data);
    if (event.error?.message) throw new Error(event.error.message);

    for (const choice of event.choices ?? []) {
      const content = normalizeContent(choice.delta?.content ?? choice.message?.content ?? "");
      if (content) {
        assistantContent += content;
        emit({ type: "assistant_delta", delta: content });
      }

      for (const toolCall of choice.delta?.tool_calls ?? []) {
        const index = toolCall.index ?? 0;
        const current = pending.get(index) ?? {
          id: toolCall.id ?? `call_${index}`,
          name: toolCall.function?.name ?? "",
          arguments: "",
        };

        pending.set(index, {
          id: toolCall.id ?? current.id,
          name: toolCall.function?.name ?? current.name,
          arguments: current.arguments + (toolCall.function?.arguments ?? ""),
        });
      }

      for (const toolCall of choice.message?.tool_calls ?? []) {
        const index = pending.size;
        pending.set(index, {
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        });
      }
    }
  }

  return {
    assistantContent,
    toolCalls: Array.from(pending.values())
      .filter((call) => call.name)
      .map((call) => ({
        id: call.id,
        type: "function" as const,
        function: {
          name: call.name,
          arguments: call.arguments || "{}",
        },
      })),
  };
}

async function executeToolCall(
  providerCall: CompletedToolCall,
  emit: (event: ClientEvent) => void,
  signal: AbortSignal,
) {
  const tool = toolRegistry.get(providerCall.function.name);
  const startedAt = Date.now();
  const input = parseToolArguments(providerCall.function.arguments);
  const logs: ToolLogEntry[] = [];
  const call: ToolCall = {
    id: providerCall.id,
    toolId: providerCall.function.name,
    toolName: tool?.name ?? providerCall.function.name,
    input,
    status: "running",
    startedAt,
    logs,
  };

  const pushLog = (entry: Omit<ToolLogEntry, "ts">) => {
    const log = { ...entry, ts: Date.now() };
    logs.push(log);
    emit({ type: "tool_call.log", callId: call.id, log });
  };

  console.log(`[agent] Executing tool: ${providerCall.function.name}`, { input });
  emit({ type: "tool_call.queued", call });

  if (!tool) {
    const error = `Unknown tool: ${providerCall.function.name}`;
    const failed = { ...call, status: "failed" as const, error, finishedAt: Date.now() };
    emit({ type: "tool_call.result", call: failed });
    return { modelPayload: { ok: false, error } };
  }

  try {
    const output = await tool.execute(input, { signal, log: pushLog });
    console.log(`[agent] Tool ${providerCall.function.name} succeeded`);
    const succeeded = {
      ...call,
      status: "succeeded" as const,
      output: summarizeToolOutput(output),
      finishedAt: Date.now(),
      logs,
    };
    emit({ type: "tool_call.result", call: succeeded });
    return { modelPayload: { ok: true, data: output } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool execution failed";
    console.error(`[agent] Tool ${providerCall.function.name} failed:`, message);
    pushLog({ level: "error", message });
    const failed = {
      ...call,
      status: "failed" as const,
      error: message,
      finishedAt: Date.now(),
      logs,
    };
    emit({ type: "tool_call.result", call: failed });
    return { modelPayload: { ok: false, error: message } };
  }
}

function parseToolArguments(args: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(args || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function summarizeToolOutput(output: unknown) {
  if (
    output &&
    typeof output === "object" &&
    "results" in output &&
    Array.isArray((output as { results?: unknown[] }).results)
  ) {
    const typed = output as {
      query?: string;
      provider?: string;
      results: Array<{ title?: string; url?: string; content?: string }>;
    };

    return {
      query: typed.query,
      provider: typed.provider,
      resultCount: typed.results.length,
      results: typed.results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
      })),
    };
  }

  return output;
}

function normalizeContent(content: string | Array<{ text?: string }>) {
  if (typeof content === "string") return content;
  return content.map((part) => part.text ?? "").join("");
}

function parseProviderEvent(data: string): ProviderStreamEvent {
  try {
    return JSON.parse(data) as ProviderStreamEvent;
  } catch {
    return {};
  }
}

async function* readSseEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      yield* drainCompleteSseEvents(buffer, (remaining) => {
        buffer = remaining;
      });
    }

    buffer += decoder.decode();
    if (buffer.trim()) yield readSseData(buffer);
  } finally {
    reader.releaseLock();
  }
}

function* drainCompleteSseEvents(
  input: string,
  setRemaining: (remaining: string) => void,
): Generator<string, void, unknown> {
  let buffer = input;
  let boundary = findSseBoundary(buffer);

  while (boundary) {
    const [index, length] = boundary;
    const rawEvent = buffer.slice(0, index);
    buffer = buffer.slice(index + length);

    const data = readSseData(rawEvent);
    if (data) yield data;

    boundary = findSseBoundary(buffer);
  }

  setRemaining(buffer);
}

function findSseBoundary(buffer: string): [number, number] | null {
  const matches = ["\r\n\r\n", "\n\n", "\r\r"]
    .map((separator) => ({ index: buffer.indexOf(separator), separator }))
    .filter((match) => match.index !== -1)
    .sort((a, b) => a.index - b.index);

  const first = matches[0];
  return first ? [first.index, first.separator.length] : null;
}

function readSseData(rawEvent: string) {
  return rawEvent
    .split(/\r?\n|\r/g)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""))
    .join("\n");
}

function isProviderSafeMessage(message: ChatCompletionMessageParam) {
  const role = (message as { role?: string }).role;
  return role !== "system" && role !== "developer" && role !== "tool";
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
