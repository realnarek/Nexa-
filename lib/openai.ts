import "server-only";
import OpenAI from "openai";

export const NEXA_MODEL =
  "nvidia/llama-3.1-nemotron-ultra-253b-v1:free";

const apiKey = process.env.OPENAI_API_KEY;

export const openaiEnabled = Boolean(apiKey);

export const openai = openaiEnabled
  ? new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null;
