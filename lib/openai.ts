import "server-only";
import OpenAI from "openai";

export const NEXA_MODEL =
  "nvidia/llama-3.1-nemotron-ultra-253b-v1:free";

const apiKey = process.env.OPENROUTER_API_KEY;

export const openaiEnabled = Boolean(apiKey);

export const openai = openaiEnabled
  ? new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME ?? "Nexa",
      },
    })
  : null;
