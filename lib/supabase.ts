/**
 * Supabase client.
 *
 * In demo mode (no env vars set) we export a no-op stub so the app
 * still runs. When real keys are provided in .env.local, the real
 * client is used.
 */

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);

export function getSupabaseClient() {
  if (!supabaseEnabled) {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.info(
        "[nexa] Supabase env vars not set — running in local demo mode.",
      );
    }
    return null;
  }
  return createBrowserClient(url!, anonKey!);
}
