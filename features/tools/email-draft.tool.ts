import { sleep, shortId } from "@/lib/utils";
import type { ToolDefinition } from "@/types";

interface EmailDraftInput {
  to: string;
  subject: string;
  goal: string; // what the email should accomplish
  tone?: "neutral" | "warm" | "direct" | "formal";
}

interface EmailDraftResult {
  draftId: string;
  to: string;
  subject: string;
  body: string;
}

const SAMPLES = {
  warm: (goal: string) =>
    `Hi there,\n\nWanted to reach out about ${goal}. I'd love to hear your thoughts and find a time that works for both of us.\n\nThanks so much,\n`,
  direct: (goal: string) =>
    `Hi,\n\nQuick one — ${goal}. Let me know if that works.\n\nBest,\n`,
  formal: (goal: string) =>
    `Dear colleague,\n\nI am writing regarding ${goal}. Please find my proposal below and let me know whether the suggested approach is acceptable.\n\nKind regards,\n`,
  neutral: (goal: string) =>
    `Hi,\n\nFollowing up on ${goal}. Happy to discuss when you have a moment.\n\nBest,\n`,
} as const;

export const emailDraftTool: ToolDefinition<EmailDraftInput, EmailDraftResult> = {
  id: "email_draft",
  name: "Email Draft",
  description: "Compose an email draft to send via the user's mail client.",
  icon: "Mail",
  category: "communication",
  connected: false,
  parameters: [
    { name: "to", type: "string", description: "Recipient address.", required: true },
    { name: "subject", type: "string", description: "Subject line.", required: true },
    { name: "goal", type: "string", description: "What the email should accomplish.", required: true },
    {
      name: "tone",
      type: "string",
      description: "Tone of voice.",
      enum: ["neutral", "warm", "direct", "formal"],
    },
  ],
  async execute({ to, subject, goal, tone = "neutral" }, ctx) {
    ctx.log({ level: "info", message: `Drafting ${tone} email to ${to}` });
    await sleep(560, ctx.signal);
    ctx.log({ level: "debug", message: "Running tone & clarity pass…" });
    await sleep(320, ctx.signal);
    return {
      draftId: shortId("eml"),
      to,
      subject,
      body: SAMPLES[tone](goal),
    };
  },
};
