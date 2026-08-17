import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function isValidUrl(urlString?: string) {
  if (!urlString) return false;
  try {
    const parsed = new URL(urlString);
    if (parsed.hostname.includes("your-project-ref") || parsed.hostname.includes("example.com")) {
      return false;
    }
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (
    !isValidUrl(url) ||
    !key ||
    key.includes("your-anon") ||
    key.includes("your-publishable") ||
    key.includes("placeholder")
  ) {
    return { url: null, key: null };
  }

  return { url: url!, key };
}

function createFallbackClient() {
  const createChainableBuilder = (): any => {
    const builder: any = new Proxy(
      () => Promise.resolve({ data: [], error: null }),
      {
        get(_target, prop) {
          if (prop === "then") {
            return (resolve: any) => resolve({ data: [], error: null });
          }
          return (..._args: any[]) => builder;
        },
        apply() {
          return builder;
        },
      }
    );
    return builder;
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase credentials are not configured in .env.local. Please set your real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase credentials are not configured in .env.local. Please set your real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      }),
      signOut: async () => ({ error: null }),
    },
    from: () => createChainableBuilder(),
  };
}

const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  return fetch(input, {
    ...init,
    signal: init?.signal ?? controller.signal,
  }).finally(() => clearTimeout(timeoutId));
};

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
    global: { fetch: fetchWithTimeout },
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
