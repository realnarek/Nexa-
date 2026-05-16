"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shortId } from "@/lib/utils";
import { runAgent, type AgentEvent } from "@/services/agent.service";
import type {
  ChatMessage,
  Conversation,
  ToolCall,
  AgentPlan,
  AgentStatus,
} from "@/types";
import { useWorkflowStore } from "./workflow-store";
import { useTaskStore } from "./task-store";

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  status: AgentStatus;
  currentPlan: AgentPlan | null;
  currentCalls: ToolCall[];
  abortController: AbortController | null;

  /* actions */
  newConversation: () => string;
  setActive: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  sendMessage: (text: string) => Promise<void>;
  stopAgent: () => void;
}

function getActive(state: ChatState): Conversation | undefined {
  return state.conversations.find((c) => c.id === state.activeId);
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      status: "idle",
      currentPlan: null,
      currentCalls: [],
      abortController: null,

      newConversation: () => {
        const id = shortId("conv");
        const conv: Conversation = {
          id,
          title: "New conversation",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeId: id,
          currentPlan: null,
          currentCalls: [],
        }));
        return id;
      },

      setActive: (id) =>
        set({ activeId: id, currentPlan: null, currentCalls: [] }),

      deleteConversation: (id) =>
        set((s) => {
          const remaining = s.conversations.filter((c) => c.id !== id);
          return {
            conversations: remaining,
            activeId: s.activeId === id ? (remaining[0]?.id ?? null) : s.activeId,
          };
        }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c,
          ),
        })),

      stopAgent: () => {
        const c = get().abortController;
        c?.abort();
        set({ status: "idle", abortController: null });
      },

      sendMessage: async (text) => {
        const state = get();
        let activeId = state.activeId;
        if (!activeId) activeId = get().newConversation();
        const previousMessages =
          state.conversations.find((c) => c.id === activeId)?.messages ?? [];

        // Push user message
        const userMsg: ChatMessage = {
          id: shortId("msg"),
          role: "user",
          content: text,
          createdAt: Date.now(),
        };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  title:
                    c.messages.length === 0 ? text.slice(0, 64) : c.title,
                  updatedAt: Date.now(),
                  messages: [...c.messages, userMsg],
                }
              : c,
          ),
          status: "thinking",
          currentPlan: null,
          currentCalls: [],
        }));

        // Placeholder assistant message we'll stream into
        const assistantMsg: ChatMessage = {
          id: shortId("msg"),
          role: "assistant",
          content: "",
          createdAt: Date.now(),
          streaming: true,
          toolCalls: [],
        };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === activeId
              ? { ...c, messages: [...c.messages, assistantMsg] }
              : c,
          ),
        }));

        const controller = new AbortController();
        set({ abortController: controller });

        const workflowId = useWorkflowStore.getState().begin(text);
        let accumulated = "";

        try {
          for await (const ev of runAgent(text, {
            signal: controller.signal,
            history: [...previousMessages, userMsg],
          })) {
            applyAgentEvent(ev);
          }
        } catch {
          set({ status: "error" });
        } finally {
          // Finalize streaming flag on the assistant message
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id !== activeId
                ? c
                : {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMsg.id ? { ...m, streaming: false } : m,
                    ),
                  },
            ),
            status: "idle",
            abortController: null,
          }));
          useWorkflowStore.getState().finalize(workflowId, "succeeded", accumulated);
        }

        function applyAgentEvent(ev: AgentEvent) {
          if (ev.type === "plan") {
            set({ currentPlan: ev.plan, status: "executing" });
            useWorkflowStore.getState().attachPlan(workflowId, ev.plan);
          } else if (ev.type === "tool_call.queued") {
            set((s) => ({
              status: "executing",
              currentCalls: upsertToolCall(s.currentCalls, ev.call),
              conversations: s.conversations.map((c) =>
                c.id !== activeId
                  ? c
                  : {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsg.id
                          ? {
                              ...m,
                              toolCalls: upsertToolCall(m.toolCalls ?? [], ev.call),
                            }
                          : m,
                      ),
                    },
              ),
            }));
          } else if (ev.type === "tool_call.log") {
            set((s) => ({
              currentCalls: appendToolLog(s.currentCalls, ev.callId, ev.log),
              conversations: s.conversations.map((c) =>
                c.id !== activeId
                  ? c
                  : {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsg.id
                          ? {
                              ...m,
                              toolCalls: appendToolLog(
                                m.toolCalls ?? [],
                                ev.callId,
                                ev.log,
                              ),
                            }
                          : m,
                      ),
                    },
              ),
            }));
          } else if (ev.type === "tool_call.result") {
            set((s) => ({
              currentCalls: upsertToolCall(s.currentCalls, ev.call),
              conversations: s.conversations.map((c) =>
                c.id !== activeId
                  ? c
                  : {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsg.id
                          ? {
                              ...m,
                              toolCalls: upsertToolCall(m.toolCalls ?? [], ev.call),
                            }
                          : m,
                      ),
                    },
              ),
            }));
            useWorkflowStore.getState().pushCall(workflowId, ev.call);

            // Side-effect: tasks created by the agent appear in the task store
            if (ev.call.toolId === "task_creator" && ev.call.status === "succeeded") {
              const out = ev.call.output as { task?: import("@/types").Task };
              if (out?.task) useTaskStore.getState().add(out.task);
            }
          } else if (ev.type === "error") {
            set({ status: "error" });
            accumulated += ev.error;
            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.id !== activeId
                  ? c
                  : {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsg.id
                          ? { ...m, content: ev.error }
                          : m,
                      ),
                    },
              ),
            }));
          } else if (ev.type === "assistant_delta") {
            accumulated += ev.delta;
            set((s) => ({
              status: "streaming",
              conversations: s.conversations.map((c) =>
                c.id !== activeId
                  ? c
                  : {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsg.id
                          ? { ...m, content: m.content + ev.delta }
                          : m,
                      ),
                    },
              ),
            }));
          }
        }
      },
    }),
    {
      name: "nexa-chat",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        conversations: s.conversations,
        activeId: s.activeId,
      }),
    },
  ),
);

export function useActiveConversation(): Conversation | undefined {
  return useChatStore(getActive);
}


function upsertToolCall(calls: ToolCall[], call: ToolCall) {
  const exists = calls.some((existing) => existing.id === call.id);
  if (!exists) return [...calls, call];
  return calls.map((existing) => (existing.id === call.id ? call : existing));
}

function appendToolLog(
  calls: ToolCall[],
  callId: string,
  log: import("@/types").ToolLogEntry,
) {
  return calls.map((call) =>
    call.id === callId ? { ...call, logs: [...call.logs, log] } : call,
  );
}
