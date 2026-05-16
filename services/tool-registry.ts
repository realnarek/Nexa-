/**
 * Nexa — Tool Registry
 *
 * The single point of registration for every tool the agent can invoke.
 * Tools are pure modules; this file wires them up and exposes lookup helpers.
 *
 * To add a new tool:
 *   1. Implement `ToolDefinition` in `features/tools/<name>.tool.ts`
 *   2. Import & register it below
 *   3. The agent will automatically be able to plan & invoke it.
 */

import type { ToolDefinition } from "@/types";
import { webSearchTool } from "@/features/tools/web-search.tool";
import { notesTool } from "@/features/tools/notes.tool";
import { emailDraftTool } from "@/features/tools/email-draft.tool";
import { taskCreatorTool } from "@/features/tools/task-creator.tool";

const tools: ToolDefinition[] = [
  webSearchTool,
  notesTool,
  emailDraftTool,
  taskCreatorTool,
];

const byId = new Map(tools.map((t) => [t.id, t]));

export const toolRegistry = {
  list(): ToolDefinition[] {
    return tools;
  },
  get(id: string): ToolDefinition | undefined {
    return byId.get(id);
  },
  byCategory(category: ToolDefinition["category"]): ToolDefinition[] {
    return tools.filter((t) => t.category === category);
  },
  /** Returns the OpenAI-style function schemas for tool calling. */
  toFunctionSchemas() {
    return tools.map((t) => ({
      name: t.id,
      description: t.description,
      parameters: {
        type: "object" as const,
        properties: Object.fromEntries(
          t.parameters.map((p) => [
            p.name,
            { type: p.type, description: p.description, enum: p.enum },
          ]),
        ),
        required: t.parameters.filter((p) => p.required).map((p) => p.name),
      },
    }));
  },
};
