/**
 * Nexa — Agent API client
 *
 * The chat UI talks to the server-side `/api/agent` endpoint and renders text
 * deltas as OpenRouter streams them through server-sent events.
 */

import { shortId } from "@/lib/utils";
import type { AgentPlan, ChatMessage, ToolCall, ToolLogEntry } from "@/types";

export type AgentEvent =
  | { type: "plan"; plan: AgentPlan }
  | { type: "tool_call.queued"; call: ToolCall }
  | { type: "tool_call.log"; callId: string; log: ToolLogEntry }
  | { type: "tool_call.result"; call: ToolCall }
  | { type: "assistant_delta"; delta: string }
  | { type: "done"; messageId: string }
  | { type: "error"; error: string };

interface RunOptions {
  signal?: AbortSignal;
  history?: ChatMessage[];
}

interface ApiError {
  error?: string;
}

interface ChatCompletionStreamEvent {
  choices?: Array<{
    delta?: {
      content?: string | Array<{ text?: string }>;
    };
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

/**
 * Run the assistant through the real API route.
 *
 * The route forwards OpenRouter's SSE stream. This adapter parses every SSE
 * event as soon as a complete event frame arrives and yields the provider delta
 * immediately, without waiting for the whole response or simulating typing.
 */
export async function* runAgent(
  request: string,
  options: RunOptions = {},
): AsyncGenerator<AgentEvent, void, unknown> {
  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ messages: buildMessages(request, options.history) }),
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    if (!response.body) {
      throw new Error("Agent response did not include a readable stream.");
    }

    let hasContent = false;
    for await (const event of readSseEvents(response.body)) {
      for (const delta of parseAssistantDeltas(event)) {
        hasContent = true;
        yield { type: "assistant_delta", delta };
      }
    }

    if (!hasContent) {
      throw new Error("Agent response did not include assistant message content.");
    }

    yield { type: "done", messageId: shortId("msg") };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;

    yield {
      type: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as ApiError;
    return payload.error ?? "Agent request failed.";
  } catch {
    return "Agent request failed.";
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
    if (buffer.trim()) {
      yield readSseData(buffer);
    }
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

function parseAssistantDeltas(data: string) {
  if (!data || data === "[DONE]") return [];

  let event: ChatCompletionStreamEvent;
  try {
    event = JSON.parse(data) as ChatCompletionStreamEvent;
  } catch {
    return [];
  }

  if (event.error?.message) {
    throw new Error(event.error.message);
  }

  return (event.choices ?? [])
    .map((choice) => choice.delta?.content ?? choice.message?.content ?? "")
    .flatMap((content) => {
      if (typeof content === "string") return content;
      return content.map((part) => part.text ?? "").join("");
    })
    .filter((delta) => delta.length > 0);
}

function buildMessages(request: string, history?: ChatMessage[]) {
  const messages = (history ?? [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    messages.push({ role: "user", content: request });
  }

  return messages;
}
