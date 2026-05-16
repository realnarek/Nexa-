import { sleep, shortId } from "@/lib/utils";
import type { ToolDefinition } from "@/types";

interface NotesInput {
  title: string;
  content: string;
  tags?: string[];
}

interface NotesResult {
  id: string;
  title: string;
  preview: string;
  savedAt: number;
}

export const notesTool: ToolDefinition<NotesInput, NotesResult> = {
  id: "notes",
  name: "Notes",
  description: "Save a structured note to the user's workspace.",
  icon: "NotebookPen",
  category: "writing",
  connected: true,
  parameters: [
    { name: "title", type: "string", description: "Note title.", required: true },
    { name: "content", type: "string", description: "Note body (markdown ok).", required: true },
    { name: "tags", type: "array", description: "Optional tag list." },
  ],
  async execute({ title, content }, ctx) {
    ctx.log({ level: "info", message: `Composing note: "${title}"` });
    await sleep(280, ctx.signal);
    ctx.log({ level: "debug", message: `Indexed ${content.length} chars for search.` });
    return {
      id: shortId("note"),
      title,
      preview: content.slice(0, 120),
      savedAt: Date.now(),
    };
  },
};
