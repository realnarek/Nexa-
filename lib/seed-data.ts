import type { Workflow, Task } from "@/types";

const now = Date.now();
const m = 60 * 1000;
const h = 60 * m;
const d = 24 * h;

export const seedWorkflows: Workflow[] = [
  {
    id: "wf_demo_01",
    title: "Plan my day",
    request: "Plan my day around 3 priorities and book focus time for each",
    status: "succeeded",
    startedAt: now - 2 * h,
    finishedAt: now - 2 * h + 18 * 1000,
    summary:
      "Drafted a 3-priority day plan, blocked focus time on calendar, and added a follow-up task.",
    toolCalls: [],
    plan: {
      goal: "Plan my day around 3 priorities and book focus time for each",
      steps: [
        { id: "s1", description: "Identify top 3 priorities", status: "done" },
        {
          id: "s2",
          description: "Create calendar blocks",
          toolId: "calendar",
          status: "done",
        },
        {
          id: "s3",
          description: "Add follow-up task",
          toolId: "task_creator",
          status: "done",
        },
      ],
    },
  },
  {
    id: "wf_demo_02",
    title: "Research competitors",
    request: "Find the top 3 AI agent platforms launched in 2026 and summarize them",
    status: "succeeded",
    startedAt: now - 1 * d - 3 * h,
    finishedAt: now - 1 * d - 3 * h + 26 * 1000,
    summary:
      "Pulled coverage from Stanford HAI, every.to, and Anthropic. Saved a comparison note.",
    toolCalls: [],
    plan: {
      goal: "Find the top 3 AI agent platforms launched in 2026 and summarize them",
      steps: [
        {
          id: "s1",
          description: "Search the web for 2026 agent platforms",
          toolId: "web_search",
          status: "done",
        },
        {
          id: "s2",
          description: "Save comparison note",
          toolId: "notes",
          status: "done",
        },
      ],
    },
  },
  {
    id: "wf_demo_03",
    title: "Reply to Bella",
    request: "Draft a warm follow-up to bella@tumo.org about the offer call",
    status: "succeeded",
    startedAt: now - 2 * d,
    finishedAt: now - 2 * d + 11 * 1000,
    summary:
      "Drafted a friendly follow-up email referencing the prior conversation.",
    toolCalls: [],
    plan: {
      goal: "Draft a warm follow-up to Bella about the offer call",
      steps: [
        {
          id: "s1",
          description: "Compose email draft",
          toolId: "email_draft",
          status: "done",
        },
      ],
    },
  },
  {
    id: "wf_demo_04",
    title: "Failed connection: Notion",
    request: "Sync today's tasks to Notion",
    status: "failed",
    startedAt: now - 3 * d,
    finishedAt: now - 3 * d + 4 * 1000,
    summary: "Could not reach Notion API — integration not connected.",
    toolCalls: [],
  },
];

export const seedTasks: Task[] = [
  {
    id: "task_seed_1",
    title: "Review Q2 roadmap with the team",
    status: "todo",
    priority: "high",
    createdAt: now - 4 * h,
    dueAt: now + 1 * d,
  },
  {
    id: "task_seed_2",
    title: "Send investor update — May",
    status: "in_progress",
    priority: "urgent",
    createdAt: now - 1 * d,
    dueAt: now + 6 * h,
  },
  {
    id: "task_seed_3",
    title: "Draft positioning doc for Nexa landing page",
    status: "todo",
    priority: "medium",
    createdAt: now - 2 * d,
  },
  {
    id: "task_seed_4",
    title: "Cancel duplicate SaaS subscriptions",
    status: "done",
    priority: "low",
    createdAt: now - 6 * d,
  },
];
