/**
 * Single source of truth for runtime config.
 * Whether or not we have real services wired up, the demo should always run.
 */

export const config = {
  appName: "Nexa",
  tagline: "An AI operating system for the rest of us.",
  version: "0.1.0",
  /** When true, agent uses mock orchestration instead of real LLM. */
  get demoMode(): boolean {
    if (typeof window !== "undefined") {
      return !process.env.NEXT_PUBLIC_OPENAI_ENABLED;
    }
    return !process.env.OPENAI_API_KEY;
  },
} as const;
