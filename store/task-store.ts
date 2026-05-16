"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shortId } from "@/lib/utils";
import { seedTasks } from "@/lib/seed-data";
import type { Task } from "@/types";

interface TaskState {
  tasks: Task[];
  hydrated: boolean;
  add: (task: Partial<Task> & { title: string }) => Task;
  update: (id: string, patch: Partial<Task>) => void;
  remove: (id: string) => void;
  toggleStatus: (id: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: seedTasks,
      hydrated: false,
      add: (input) => {
        const task: Task = {
          id: shortId("task"),
          title: input.title,
          status: input.status ?? "todo",
          priority: input.priority ?? "medium",
          createdAt: input.createdAt ?? Date.now(),
          dueAt: input.dueAt,
          notes: input.notes,
          workflowId: input.workflowId,
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return task;
      },
      update: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      remove: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleStatus: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id !== id
              ? t
              : {
                  ...t,
                  status:
                    t.status === "done"
                      ? "todo"
                      : t.status === "todo"
                        ? "in_progress"
                        : "done",
                },
          ),
        })),
    }),
    {
      name: "nexa-tasks",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
