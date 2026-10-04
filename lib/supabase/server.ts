import "server-only";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type {SupabaseClient} from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { enforceMfa } from "@/lib/auth/mfa";
import { authCookieOptions } from "@/lib/auth/cookie-options";

function createFallbackClient() {

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Sign-in is temporarily unavailable. Please try again later." },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: "Sign-in is temporarily unavailable. Please try again later." },
      }),
      signOut: async () => ({ error: null }),
    },
    from: () => { throw new Error("Database configuration is unavailable"); },
  };
}

const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const isAuthRequest = String(input instanceof Request ? input.url : input).includes("/auth/v1/");
  const timeoutId = setTimeout(() => controller.abort(), isAuthRequest ? 15000 : 3000);
  return fetch(input, {
    ...init,
    signal: init?.signal ?? controller.signal,
  }).finally(() => clearTimeout(timeoutId));
};

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Uses a server-held publishable key + the user's session cookie — RLS
 * still applies, this is NOT the service-role client.
 */
export async function createClient(clientOptions: {allowMfaChallenge?:boolean; next?:string} = {}):Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const config = getSupabaseConfig();

  if (!config) {
    return createFallbackClient() as unknown as SupabaseClient;
  }

  const client = createServerClient(config.url, config.key, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, authCookieOptions(name, options))
          );
        } catch {
          // Called from a Server Component with no write access to
          // cookies — safe to ignore because middleware.ts refreshes
          // the session on every request.
        }
      },
    },
  });
  if (!clientOptions.allowMfaChallenge) {
    const verifiedGetUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = async (jwt?: string) => {
      const result = await verifiedGetUser(jwt);
      if (result.data.user && !result.error) {
        let next = clientOptions.next;
        if (!next && result.data.user.factors?.some(f => f.status === "verified")) {
          next = (await headers()).get("x-learningmap-path") ?? "/dashboard";
        }
        await enforceMfa(client, result.data.user, next);
      }
      return result;
    };
  }
  return client;
}
