import "server-only";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@supabase/supabase-js";

/** Check the owner's password without replacing their browser session. */
export async function verifyAgentPassword(userId: string, email: string, password: string): Promise<"verified" | "invalid" | "unavailable"> {
  const config = getSupabaseConfig();
  if (!config) return "unavailable";
  try {
    const client = createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) },
    });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    // Revoke the temporary verification session, never the website's session.
    if (data.session) {
      const cleanup = await client.auth.signOut({ scope: "local" });
      if (cleanup.error) return "unavailable";
    }
    if (error) return error.status && error.status >= 500 ? "unavailable" : "invalid";
    return data.session && data.user?.id === userId && data.user.email_confirmed_at && !data.user.is_anonymous ? "verified" : "invalid";
  } catch {
    return "unavailable";
  }
}
