/**
 * Nexa — Agent API client
 *
 * The chat UI talks to the server-side `/api/agent` endpoint and renders text
 * chunks as they stream back from OpenRouter.
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

/**
 * Run the assistant through the real API route.
 *
 * The route streams plain text chunks. This adapter converts each decoded chunk
 * into the existing `assistant_delta` event so the store can progressively
 * append text to the in-flight assistant message without changing the app
 * architecture.
 */
export async function* runAgent(
  request: string,
  options: RunOptions = {},
): AsyncGenerator<AgentEvent, void, unknown> {
  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: buildMessages(request, options.history) }),
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    if (!response.body) {
      throw new Error("Agent response did not include a readable stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let hasContent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const delta = decoder.decode(value, { stream: true });
      if (delta) {
        hasContent = true;
        yield { type: "assistant_delta", delta };
      }
    }

    const remaining = decoder.decode();
    if (remaining) {
      hasContent = true;
      yield { type: "assistant_delta", delta: remaining };
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
