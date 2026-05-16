/**
 * Nexa — Tool Registry
 */

import type { ToolDefinition } from "@/types";

const tools: ToolDefinition[] = [];

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

  toFunctionSchemas() {
    return [];
  },
};
