import { sleep, shortId } from "@/lib/utils";
import type { ToolDefinition, Task } from "@/types";

interface TaskCreatorInput {
  title: string;
  priority?: Task["priority"];
  dueAt?: string;
  notes?: string;
}

interface TaskCreatorResult {
  task: Task;
}

export const taskCreatorTool: ToolDefinition<TaskCreatorInput, TaskCreatorResult> = {
  id: "task_creator",
  name: "Task Creator",
  description: "Add a task to the user's task list.",
  icon: "ListChecks",
  category: "productivity",
  connected: true,
  parameters: [
    { name: "title", type: "string", description: "Task title.", required: true },
    {
      name: "priority",
      type: "string",
      description: "Priority.",
      enum: ["low", "medium", "high", "urgent"],
    },
    { name: "dueAt", type: "string", description: "ISO due date." },
    { name: "notes", type: "string", description: "Free-form notes." },
  ],
  async execute({ title, priority = "medium", dueAt, notes }, ctx) {
    ctx.log({ level: "info", message: `Creating task "${title}"` });
    await sleep(220, ctx.signal);
    const task: Task = {
      id: shortId("task"),
      title,
      status: "todo",
      priority,
      dueAt: dueAt ? new Date(dueAt).getTime() : undefined,
      notes,
      createdAt: Date.now(),
    };
    return { task };
  },
};
