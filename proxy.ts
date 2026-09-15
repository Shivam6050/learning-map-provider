import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard"];

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

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (request.nextUrl.pathname === "/api/health" || request.nextUrl.pathname === "/auth/callback") return response;
  // Recover a PKCE response sent to the Site URL instead of the callback.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", request.nextUrl.searchParams.get("code")!);
    callback.searchParams.set("next", "/dashboard");
    const redirect = NextResponse.redirect(callback);
    redirect.headers.set("Cache-Control", "private, no-store");
    redirect.headers.set("Referrer-Policy", "no-referrer");
    return redirect;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  // If Supabase credentials are missing or placeholders, bypass proxy auth refresh instantly
  if (
    !isValidUrl(url) ||
    !key ||
    key.includes("your-anon") ||
    key.includes("your-publishable") ||
    key.includes("placeholder")
  ) {
    return response;
  }

  try {
    const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      return fetch(input, {
        ...init,
        signal: init?.signal ?? controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    };

    const supabase = createServerClient(url!, key, {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    // Let protected server pages validate the session on transient failures.
    if (authError && (authError.status === 0 || (authError.status ?? 0) >= 500 || authError.name === "AuthRetryableFetchError")) return response;

    const isProtected = PROTECTED_PREFIXES.some((p) =>
      request.nextUrl.pathname.startsWith(p)
    );

    if (isProtected && !user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      const loginResponse = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach(cookie => loginResponse.cookies.set(cookie));
      return loginResponse;
    }
  } catch {
    // If Supabase network call fails or times out, pass through safely
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
