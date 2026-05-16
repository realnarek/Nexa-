/**
 * Nexa — Core agent types
 * The vocabulary every other module speaks.
 */

export type AgentStatus = "idle" | "thinking" | "executing" | "streaming" | "error";

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  /** Optional tool calls produced during this turn. */
  toolCalls?: ToolCall[];
  /** True while content is still being streamed in. */
  streaming?: boolean;
}

export interface ToolCall {
  id: string;
  toolId: string;
  toolName: string;
  input: Record<string, unknown>;
  status: "queued" | "running" | "succeeded" | "failed";
  output?: unknown;
  error?: string;
  startedAt: number;
  finishedAt?: number;
  logs: ToolLogEntry[];
}

export interface ToolLogEntry {
  ts: number;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface AgentPlan {
  /** Plain-language summary of intent. */
  goal: string;
  /** Ordered list of steps the agent intends to take. */
  steps: AgentPlanStep[];
}

export interface AgentPlanStep {
  id: string;
  description: string;
  toolId?: string;
  status: "pending" | "active" | "done" | "skipped";
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}
