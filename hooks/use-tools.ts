"use client";

import { toolRegistry } from "@/services/tool-registry";

export function useTools() {
  return {
    all: toolRegistry.list(),
    get: toolRegistry.get.bind(toolRegistry),
    byCategory: toolRegistry.byCategory.bind(toolRegistry),
  };
}
