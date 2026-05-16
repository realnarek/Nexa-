"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shortId } from "@/lib/utils";
import { seedWorkflows } from "@/lib/seed-data";
import type { Workflow, ToolCall, AgentPlan, WorkflowStatus } from "@/types";

interface WorkflowState {
  workflows: Workflow[];
  begin: (request: string) => string;
  attachPlan: (id: string, plan: AgentPlan) => void;
  pushCall: (id: string, call: ToolCall) => void;
  finalize: (id: string, status: WorkflowStatus, summary?: string) => void;
  remove: (id: string) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set) => ({
      workflows: seedWorkflows,
      begin: (request) => {
        const id = shortId("wf");
        const wf: Workflow = {
          id,
          title: request.slice(0, 80),
          request,
          status: "running",
          toolCalls: [],
          startedAt: Date.now(),
        };
        set((s) => ({ workflows: [wf, ...s.workflows] }));
        return id;
      },
      attachPlan: (id, plan) =>
        set((s) => ({
          workflows: s.workflows.map((w) => (w.id === id ? { ...w, plan } : w)),
        })),
      pushCall: (id, call) =>
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id ? { ...w, toolCalls: [...w.toolCalls, call] } : w,
          ),
        })),
      finalize: (id, status, summary) =>
        set((s) => ({
          workflows: s.workflows.map((w) =>
            w.id === id
              ? { ...w, status, summary, finishedAt: Date.now() }
              : w,
          ),
        })),
      remove: (id) =>
        set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) })),
    }),
    {
      name: "nexa-workflows",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
