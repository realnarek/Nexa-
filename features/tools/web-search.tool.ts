import { sleep } from "@/lib/utils";
import type { ToolDefinition } from "@/types";

interface WebSearchInput {
  query: string;
  limit?: number;
}

interface WebSearchResult {
  results: Array<{ title: string; url: string; snippet: string }>;
  source: "mock" | "live";
}

const MOCK_RESULTS: Record<string, WebSearchResult["results"]> = {
  default: [
    {
      title: "The 2026 State of AI Agents — Stanford HAI",
      url: "https://hai.stanford.edu/state-of-ai-agents-2026",
      snippet:
        "Production agentic systems now handle 38% of internal SaaS workflows at Fortune 500s, up from 6% in 2024.",
    },
    {
      title: "How agentic UX is replacing the dashboard",
      url: "https://every.to/p/the-dashboard-is-dead",
      snippet:
        "When the interface can act on your behalf, you stop measuring it in clicks and start measuring it in outcomes.",
    },
    {
      title: "Anthropic — Tools, not chat",
      url: "https://www.anthropic.com/research/tools-not-chat",
      snippet:
        "Tool-use is the primitive that turns language models into actual operating systems for knowledge work.",
    },
  ],
};

export const webSearchTool: ToolDefinition<WebSearchInput, WebSearchResult> = {
  id: "web_search",
  name: "Web Search",
  description: "Search the public web and return ranked snippets.",
  icon: "Globe",
  category: "search",
  connected: true,
  parameters: [
    { name: "query", type: "string", description: "Search query.", required: true },
    { name: "limit", type: "number", description: "Max results (1-10).", required: false },
  ],
  async execute({ query, limit = 3 }, ctx) {
    ctx.log({ level: "info", message: `Dispatching query: "${query}"` });
    await sleep(420, ctx.signal);
    ctx.log({ level: "debug", message: "Fetched 8 candidates, reranking…" });
    await sleep(360, ctx.signal);
    const results = (MOCK_RESULTS.default ?? []).slice(0, limit);
    ctx.log({ level: "info", message: `Returned ${results.length} results.` });
    return { results, source: "mock" };
  },
};
