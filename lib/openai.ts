import "server-only";
import OpenAI from "openai";

export const NEXA_MODEL =
  "nvidia/llama-3.1-nemotron-ultra-253b-v1:free";

const openrouterApiKey = process.env.OPENROUTER_API_KEY;

export const openrouterEnabled = Boolean(openrouterApiKey);

export const openrouter = openrouterEnabled
  ? new OpenAI({
      apiKey: openrouterApiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://nexa.app",
        "X-Title": "Nexa",
      },
    })
  : null;
