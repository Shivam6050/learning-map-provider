import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

function createFallbackServiceClient() {
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
    from: () => createChainableBuilder(),
  };
}

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
const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  return fetch(input, {
    ...init,
    signal: init?.signal ?? controller.signal,
  }).finally(() => clearTimeout(timeoutId));
};

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (
    !isValidUrl(url) ||
    !key ||
    key.includes("your-service-role") ||
    key.includes("placeholder")
  ) {
    return createFallbackServiceClient() as any;
  }

  return createSupabaseClient(url!, key, {
    global: { fetch: fetchWithTimeout },
    auth: { persistSession: false },
  });
}
