import type { ToolExecutionContext } from "@/types";

export interface WebSearchInput {
  query: string;
  max_results?: number;
  search_depth?: "basic" | "advanced";
}

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  publishedDate?: string;
}

export interface WebSearchOutput {
  query: string;
  provider: "tavily";
  results: WebSearchResult[];
  answer?: string;
}

export async function executeWebSearch(
  input: Record<string, unknown>,
  ctx: ToolExecutionContext,
): Promise<WebSearchOutput> {
  const query = String(input.query ?? "").trim();
  if (!query) throw new Error("web_search requires a non-empty query.");

  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Web search is not configured. Set TAVILY_API_KEY in .env.local.",
    );
  }

  const maxResults = clamp(Number(input.max_results ?? 5), 1, 8);
  const depth = input.search_depth === "advanced" ? "advanced" : "basic";

  ctx.log({ level: "info", message: `Searching the web for: ${query}` });

  return searchTavily(query, maxResults, depth, apiKey, ctx);
}

async function searchTavily(
  query: string,
  maxResults: number,
  depth: "basic" | "advanced",
  apiKey: string,
  ctx: ToolExecutionContext,
): Promise<WebSearchOutput> {
  let response: Response;
  try {
    response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: maxResults,
        search_depth: depth,
        include_answer: true,
        include_raw_content: false,
      }),
      signal: ctx.signal,
    });
  } catch (fetchError) {
    const msg = fetchError instanceof Error ? fetchError.message : String(fetchError);
    console.error("[web-search] Tavily fetch error:", msg);
    throw new Error(`Tavily request failed: ${msg}`);
  }

  if (!response.ok) {
    let errorBody = "";
    try {
      errorBody = await response.text();
    } catch {
      errorBody = "(unreadable)";
    }
    console.error(
      `[web-search] Tavily error ${response.status} ${response.statusText}:`,
      errorBody,
    );
    throw new Error(
      `Tavily search failed (${response.status}): ${errorBody || response.statusText}`,
    );
  }

  const payload = (await response.json()) as {
    answer?: string;
    results?: Array<{
      title?: string;
      url?: string;
      content?: string;
      score?: number;
      published_date?: string;
    }>;
  };

  const results = (payload.results ?? [])
    .filter((result) => result.title && result.url)
    .slice(0, maxResults)
    .map((result) => ({
      title: result.title ?? "Untitled result",
      url: result.url ?? "",
      content: result.content ?? "",
      score: result.score,
      publishedDate: result.published_date,
    }));

  ctx.log({ level: "info", message: `Found ${results.length} results` });

  return {
    query,
    provider: "tavily",
    results,
    answer: payload.answer,
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
