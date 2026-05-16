"use client";

import { useChatStore } from "@/store/chat-store";

/**
 * Thin facade over the chat store for components that don't need
 * to know about the underlying state shape.
 */
export function useAgent() {
  const status = useChatStore((s) => s.status);
  const currentPlan = useChatStore((s) => s.currentPlan);
  const currentCalls = useChatStore((s) => s.currentCalls);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const stop = useChatStore((s) => s.stopAgent);

  return {
    status,
    plan: currentPlan,
    calls: currentCalls,
    busy: status !== "idle" && status !== "error",
    send: sendMessage,
    stop,
  };
}
