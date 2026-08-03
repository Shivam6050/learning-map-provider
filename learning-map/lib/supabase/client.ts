import { createBrowserClient } from "@supabase/ssr";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  return { url, key };
}

function createFallbackClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase credentials are not configured." },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase credentials are not configured." },
      }),
      signOut: async () => ({ error: null }),
    },
  };
}

/**
 * Supabase client for use in Client Components.
 * Reads the anon key — safe to expose in the browser because
 * every table is protected by the RLS policies in supabase/schema.sql.
 */
export function createClient() {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    return createFallbackClient() as any;
  }

  return createBrowserClient(url, key);
}
