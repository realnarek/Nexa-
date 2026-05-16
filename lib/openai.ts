/**
 * OpenAI client.
 *
 * Server-only — never import this from a client component.
 * Demo mode falls back to a mock streaming agent if no key is present.
 */

import "server-only";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export const openaiEnabled = Boolean(apiKey);

export const openai = openaiEnabled
  ? new OpenAI({ apiKey })
  : null;

export const NEXA_MODEL = process.env.NEXA_MODEL ?? "gpt-4o-mini";
