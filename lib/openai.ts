import "server-only";
import OpenAI from "openai";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const NEXA_MODEL = process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";

const apiKey = process.env.OPENROUTER_API_KEY;

export const openRouterApiKey = apiKey;

export const openaiEnabled = Boolean(apiKey);


export const openRouterDefaultHeaders = {
  "HTTP-Referer":
    process.env.OPENROUTER_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000",
  "X-OpenRouter-Title": "Nexa",
  "X-Title": "Nexa",
};

export const openai = openaiEnabled
  ? new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: openRouterDefaultHeaders,
    })
  : null;
