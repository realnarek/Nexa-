/**
 * Nexa — Tool Registry
 *
 * Central catalog for model-callable tools. Tool definitions stay small and
 * serializable so the UI can render metadata, while execute handlers provide
 * the server-side implementation used by the agent route.
 */

import type { ToolDefinition, ToolParameterSchema } from "@/types";

const tools: ToolDefinition[] = [
  {
    id: "web_search",
    name: "Web Search",
    description:
      "Search the live web for current, factual, or source-backed information. Use only when the answer may require recent information, verification, or citations.",
    icon: "Search",
    category: "search",
    connected: true,
    parameters: [
      {
        name: "query",
        type: "string",
        description: "A concise search query for the information needed.",
        required: true,
      },
      {
        name: "max_results",
        type: "number",
        description: "Number of results to return, from 1 to 8. Default is 5.",
      },
      {
        name: "search_depth",
        type: "string",
        description: "Search depth. Use basic for most queries; advanced for complex research.",
        enum: ["basic", "advanced"],
      },
    ],
    execute: async (input, ctx) => {
      const { executeWebSearch } = await import("./tools/web-search");
      return executeWebSearch(input, ctx);
    },
  },
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

  toFunctionSchemas() {
    return tools.map((tool) => ({
      name: tool.id,
      description: tool.description,
      parameters: parametersToJsonSchema(tool.parameters),
    }));
  },
};

function parametersToJsonSchema(parameters: ToolParameterSchema[]) {
  return {
    type: "object",
    properties: Object.fromEntries(
      parameters.map((param) => [
        param.name,
        {
          type: param.type,
          description: param.description,
          ...(param.enum ? { enum: param.enum } : {}),
        },
      ]),
    ),
    required: parameters.filter((param) => param.required).map((param) => param.name),
    additionalProperties: false,
  };
}
