/**
 * Nexa — Agent Orchestrator
 *
 * Mock reasoning pipeline. In a real deployment this would be replaced
 * with an LLM tool-calling loop (or LangGraph). The interface stays the
 * same: feed it a user request, get back a typed stream of agent events.
 *
 * Why mock?
 *  - The demo must run without API keys.
 *  - It lets us showcase the UX of planning + tool execution deterministically.
 *
 * The shape mirrors what the real loop will emit:
 *   plan → tool_call.queued → tool_call.running → tool_call.result → assistant_delta → done
 */

import { toolRegistry } from "./tool-registry";
import { sleep, shortId } from "@/lib/utils";
import type {
  AgentPlan,
  AgentPlanStep,
  ChatMessage,
  ToolCall,
  ToolLogEntry,
} from "@/types";

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

/**
 * Heuristic intent classifier — picks which tools the agent should use.
 * In production this is replaced by the LLM's tool selection.
 */
function planFor(request: string): AgentPlan {
  const r = request.toLowerCase();
  const steps: AgentPlanStep[] = [];

  const want = (test: RegExp) => test.test(r);

  if (want(/search|look up|find|research|what is|who is|latest/)) {
    steps.push({
      id: shortId("step"),
      description: "Search the web for relevant context",
      toolId: "web_search",
      status: "pending",
    });
  }
  if (want(/email|reply|draft|message|write to/)) {
    steps.push({
      id: shortId("step"),
      description: "Draft an email tailored to the user's goal",
      toolId: "email_draft",
      status: "pending",
    });
  }
  if (want(/schedule|book|meeting|calendar|invite/)) {
    steps.push({
      id: shortId("step"),
      description: "Create a calendar event",
      toolId: "calendar",
      status: "pending",
    });
  }
  if (want(/note|summari[sz]e|capture|jot/)) {
    steps.push({
      id: shortId("step"),
      description: "Save a summary note to the workspace",
      toolId: "notes",
      status: "pending",
    });
  }
  if (want(/task|todo|to-do|to do|remind|plan my day|checklist|list/)) {
    steps.push({
      id: shortId("step"),
      description: "Create tasks in the user's task list",
      toolId: "task_creator",
      status: "pending",
    });
  }

  // Fallback — at minimum we draft a reply
  if (steps.length === 0) {
    steps.push({
      id: shortId("step"),
      description: "Compose a direct answer using language model",
      status: "pending",
    });
  }
  steps.push({
    id: shortId("step"),
    description: "Synthesize a final response for the user",
    status: "pending",
  });

  return {
    goal: deriveGoal(request),
    steps,
  };
}

function deriveGoal(request: string): string {
  const trimmed = request.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 90) return trimmed;
  return trimmed.slice(0, 87) + "…";
}

/** Generate plausible tool inputs from the natural-language request. */
function inputsFor(toolId: string, request: string): Record<string, unknown> {
  switch (toolId) {
    case "web_search":
      return { query: extractQuery(request), limit: 3 };
    case "email_draft":
      return {
        to: extractEmail(request) ?? "recipient@example.com",
        subject: "Following up",
        goal: deriveGoal(request),
        tone: /formal/i.test(request) ? "formal" : "warm",
      };
    case "calendar":
      return {
        title: deriveGoal(request),
        startsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        durationMinutes: 30,
      };
    case "notes":
      return {
        title: deriveGoal(request),
        content: `Captured from agent run on ${new Date().toLocaleString()}.\n\nRequest: ${request}`,
      };
    case "task_creator":
      return {
        title: deriveGoal(request),
        priority: /urgent|asap|now/i.test(request) ? "urgent" : "medium",
      };
    default:
      return {};
  }
}

function extractQuery(req: string): string {
  return req
    .replace(/please|can you|could you|search( for)?|look up|find( me)?/gi, "")
    .trim()
    .slice(0, 80);
}

function extractEmail(req: string): string | null {
  const m = req.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  return m ? m[0] : null;
}

/**
 * Generate the assistant's final reply based on which tools ran.
 * Streams character-by-character so the UI feels alive.
 */
function composeReply(plan: AgentPlan, calls: ToolCall[]): string {
  const usedTools = calls.map((c) => c.toolName);
  const lines: string[] = [];

  lines.push(`Here's what I did for "${plan.goal}":`);
  lines.push("");

  if (usedTools.length > 0) {
    for (const call of calls) {
      lines.push(`• **${call.toolName}** — ${describeOutcome(call)}`);
    }
  } else {
    lines.push("• Drafted a direct response without external tool calls.");
  }

  lines.push("");
  lines.push(
    "Anything you'd like me to adjust, or want me to chain this into a recurring workflow?",
  );

  return lines.join("\n");
}

function describeOutcome(call: ToolCall): string {
  const out = call.output as Record<string, unknown> | undefined;
  if (!out) return "completed.";
  switch (call.toolId) {
    case "web_search": {
      const results = (out as { results?: unknown[] }).results;
      return `returned ${results?.length ?? 0} relevant sources.`;
    }
    case "notes":
      return `saved note "${(out as { title?: string }).title}".`;
    case "calendar":
      return `scheduled event on ${new Date((out as { startsAt: string }).startsAt).toLocaleString()}.`;
    case "email_draft":
      return `drafted email to ${(out as { to?: string }).to}.`;
    case "task_creator": {
      const t = (out as { task?: { title?: string } }).task;
      return `created task "${t?.title}".`;
    }
    default:
      return "completed.";
  }
}

/**
 * Run the agent. Yields a stream of typed events.
 */
export async function* runAgent(
  request: string,
  options: RunOptions = {},
): AsyncGenerator<AgentEvent, void, unknown> {
  const signal = options.signal ?? new AbortController().signal;

  try {
    // 1. Plan
    const plan = planFor(request);
    yield { type: "plan", plan };
    await sleep(280, signal);

    const calls: ToolCall[] = [];

    // 2. Execute each tool step
    for (const step of plan.steps) {
      if (!step.toolId) continue;
      const tool = toolRegistry.get(step.toolId);
      if (!tool) continue;

      const call: ToolCall = {
        id: shortId("call"),
        toolId: tool.id,
        toolName: tool.name,
        input: inputsFor(tool.id, request),
        status: "queued",
        startedAt: Date.now(),
        logs: [],
      };
      yield { type: "tool_call.queued", call };
      await sleep(180, signal);

      call.status = "running";
      try {
        const output = await tool.execute(call.input, {
          signal,
          log: (entry) => {
            const log: ToolLogEntry = { ts: Date.now(), ...entry };
            call.logs.push(log);
          },
        });
        call.output = output;
        call.status = "succeeded";
      } catch (err) {
        call.status = "failed";
        call.error = err instanceof Error ? err.message : String(err);
      }
      call.finishedAt = Date.now();
      calls.push(call);
      yield { type: "tool_call.result", call };
    }

    // 3. Stream the final assistant reply
    const reply = composeReply(plan, calls);
    const messageId = shortId("msg");
    for (const chunk of chunkText(reply, 8)) {
      if (signal.aborted) break;
      yield { type: "assistant_delta", delta: chunk };
      await sleep(22, signal);
    }
    yield { type: "done", messageId };
  } catch (err) {
    yield {
      type: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function* chunkText(text: string, size: number): Generator<string> {
  for (let i = 0; i < text.length; i += size) {
    yield text.slice(i, i + size);
  }
}
