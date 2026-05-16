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
  provider: "tavily" | "serper";
  results: WebSearchResult[];
  answer?: string;
}

export async function executeWebSearch(
  input: Record<string, unknown>,
  ctx: ToolExecutionContext,
): Promise<WebSearchOutput> {
  const query = String(input.query ?? "").trim();
  if (!query) throw new Error("web_search requires a non-empty query.");

  const maxResults = clamp(Number(input.max_results ?? 5), 1, 8);
  const depth = input.search_depth === "advanced" ? "advanced" : "basic";

  ctx.log({ level: "info", message: "Searching the web…" });

  if (process.env.TAVILY_API_KEY?.trim()) {
    return searchTavily(query, maxResults, depth, ctx);
  }

  if (process.env.SERPER_API_KEY?.trim()) {
    return searchSerper(query, maxResults, ctx);
  }

  throw new Error(
    "Web search is not configured. Set TAVILY_API_KEY or SERPER_API_KEY on the server.",
  );
}

async function searchTavily(
  query: string,
  maxResults: number,
  depth: "basic" | "advanced",
  ctx: ToolExecutionContext,
): Promise<WebSearchOutput> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
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

  if (!response.ok) {
    throw new Error(`Tavily search failed (${response.status}).`);
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

async function searchSerper(
  query: string,
  maxResults: number,
  ctx: ToolExecutionContext,
): Promise<WebSearchOutput> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.SERPER_API_KEY ?? "",
    },
    body: JSON.stringify({ q: query, num: maxResults }),
    signal: ctx.signal,
  });

  if (!response.ok) {
    throw new Error(`Serper search failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    answerBox?: { answer?: string; snippet?: string };
    organic?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
      date?: string;
    }>;
  };

  const results = (payload.organic ?? [])
    .filter((result) => result.title && result.link)
    .slice(0, maxResults)
    .map((result) => ({
      title: result.title ?? "Untitled result",
      url: result.link ?? "",
      content: result.snippet ?? "",
      publishedDate: result.date,
    }));

  ctx.log({ level: "info", message: `Found ${results.length} results` });

  return {
    query,
    provider: "serper",
    results,
    answer: payload.answerBox?.answer ?? payload.answerBox?.snippet,
  };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
