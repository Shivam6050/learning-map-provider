import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY ENTIRELY.
 *
 * Only ever import this from server-only code: Route Handlers, Server
 * Actions, or backend scripts (e.g. the Stage 2-4 AI pipeline writing
 * resources/trusted_sources rows). NEVER import this from a Client
 * Component or anything that ships to the browser — the service-role
 * key must never reach client-side JavaScript.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix, so
 * Next.js will not bundle it into client code) in .env.local.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("Supabase service role credentials are not configured.");
  }

  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}
