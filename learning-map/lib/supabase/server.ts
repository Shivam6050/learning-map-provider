import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  };
}

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Uses the anon key + the user's session cookie — RLS
 * still applies, this is NOT the service-role client.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    return createFallbackClient() as any;
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component with no write access to
          // cookies — safe to ignore because middleware.ts refreshes
          // the session on every request.
        }
      },
    },
  });
}
