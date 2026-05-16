/**
 * Nexa — Workflow & Task types.
 *
 * A Workflow is a persisted record of one end-to-end agent run:
 * the user's request, the plan, every tool call, and the final result.
 */

import type { AgentPlan, ToolCall } from "./agent";

export type WorkflowStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface Workflow {
  id: string;
  /** Human-readable name (often the first user message). */
  title: string;
  request: string;
  status: WorkflowStatus;
  plan?: AgentPlan;
  toolCalls: ToolCall[];
  startedAt: number;
  finishedAt?: number;
  /** Final assistant reply, if any. */
  summary?: string;
}

export interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  /** Source workflow that generated this task, if applicable. */
  workflowId?: string;
  createdAt: number;
  dueAt?: number;
  notes?: string;
}
