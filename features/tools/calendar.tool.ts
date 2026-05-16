import { sleep, shortId } from "@/lib/utils";
import type { ToolDefinition } from "@/types";

interface CalendarInput extends Record<string, unknown> {
  title: string;
  startAt: string;
  durationMinutes?: number;
  attendees?: string[];
}

interface CalendarResult {
  eventId: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  link: string;
}

export const calendarTool: ToolDefinition<CalendarInput, CalendarResult> = {
  id: "calendar",
  name: "Calendar",
  description: "Create a calendar event on the user's primary calendar.",
  icon: "CalendarPlus",
  category: "planning",
  connected: false, // not "connected" in demo — still executable as mock
  parameters: [
    { name: "title", type: "string", description: "Event title.", required: true },
    { name: "startsAt", type: "string", description: "ISO 8601 start time.", required: true },
    { name: "durationMinutes", type: "number", description: "Duration in minutes." },
    { name: "attendees", type: "array", description: "Optional attendee emails." },
  ],
  async execute(input, ctx) {
  const {
    title,
    startsAt,
    durationMinutes = 30,
    attendees,
  } = input as CalendarInput;
    ctx.log({ level: "info", message: `Drafting event "${title}"` });
    await sleep(310, ctx.signal);
    if (attendees?.length) {
      ctx.log({ level: "debug", message: `Checking availability for ${attendees.length} attendee(s)…` });
      await sleep(420, ctx.signal);
    }
    return {
      eventId: shortId("evt"),
      title,
      startsAt,
      durationMinutes,
      link: "https://calendar.app/event/" + shortId(),
    };
  },
};
