/**
 * Nexa — Agent API client
 *
 * The chat UI talks to the server-side `/api/agent` endpoint and renders the
 * assistant text returned by the provider response at
 * `completion.choices[0].message.content`.
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

interface ProviderCompletion {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    } | null;
  }>;
}

interface ApiError {
  error?: string;
}

/**
 * Run the assistant through the real API route.
 *
 * The route returns the raw OpenAI/OpenRouter chat completion object. The UI
 * only needs the assistant's final text, so this adapter extracts
 * `choices[0].message.content` and emits it as the existing assistant message
 * event without any mock orchestration summary formatting.
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

    const payload = (await response.json()) as ProviderCompletion & ApiError;

    if (!response.ok) {
      throw new Error(payload.error ?? "Agent request failed.");
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Agent response did not include assistant message content.");
    }

    yield { type: "assistant_delta", delta: content };
    yield { type: "done", messageId: payload.id ?? shortId("msg") };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;

    yield {
      type: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
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
