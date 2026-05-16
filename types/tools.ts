/**
 * Nexa — Tool system contracts.
 *
 * A Tool is a typed capability the agent can invoke. Tools are pure,
 * declarative units; they declare their schema and an execute() handler
 * that the orchestrator can call (real or mocked).
 */

import type { ToolLogEntry } from "./agent";

export interface ToolParameterSchema {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface ToolDefinition<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> {
  id: string;
  name: string;
  description: string;
  /** Lucide icon name — kept as string so JSON-serializable. */
  icon: string;
  category: "search" | "writing" | "productivity" | "planning" | "communication";
  parameters: ToolParameterSchema[];
  /**
   * Whether this tool is currently connected (real integration available).
   * Mock tools are still executable in demo mode.
   */
  connected: boolean;
  /** Run the tool and return a structured output. */
  execute: (input: TInput, ctx: ToolExecutionContext) => Promise<TOutput>;
}

export interface ToolExecutionContext {
  /** Push a log entry — the UI streams these into the execution panel. */
  log: (entry: Omit<ToolLogEntry, "ts">) => void;
  /** Cooperative cancellation. */
  signal: AbortSignal;
}

export interface ToolResult<T = unknown> {
  toolId: string;
  ok: boolean;
  data?: T;
  error?: string;
  durationMs: number;
  logs: ToolLogEntry[];
}
