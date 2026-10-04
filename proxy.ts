import { getSupabaseConfig } from "@/lib/supabase/config";
import { authCookieOptions } from "@/lib/auth/cookie-options";
import { contentSecurityPolicy } from "@/lib/security/content-security-policy";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard"];

export async function proxy(request: NextRequest) {
  // Machine routes use their own scoped-key guard; never refresh browser sessions here.
  if (["/mcp", "/api/public/catalog", "/api/public/roadmap", "/llms.txt", "/robots.txt", "/sitemap.xml"].includes(request.nextUrl.pathname)) return NextResponse.next();
  // Overwrite the caller's value; server guards use this only for a safe return path.
  request.headers.set("x-learningmap-path", request.nextUrl.pathname + request.nextUrl.search);
  const isPage = !request.nextUrl.pathname.startsWith("/api/");
  const policy = isPage ? contentSecurityPolicy(
    Buffer.from(crypto.randomUUID()).toString("base64"),
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NODE_ENV === "development",
  ) : null;
  if (policy) {
    // Override incoming values: only our newly generated nonce may authorize scripts.
    request.headers.set("Content-Security-Policy", policy);
  }
  const privatePrefixes = ["/dashboard", "/settings", "/paths", "/onboarding", "/complete-profile", "/verify-contact", "/auth", "/login", "/signup", "/forgot-password", "/reset-password", "/admin"];
  const isPrivate = () => privatePrefixes.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + "/"))
    || request.cookies.getAll().some(c => /^sb-.+-auth-token(?:\.\d+)?$/.test(c.name));
  const secure = (result: NextResponse) => {
    // Public pages can also contain the signed-in user's name in the navbar.
    if (isPrivate()) {
      result.headers.set("Cache-Control", "private, no-store");
      result.headers.set("Referrer-Policy", "no-referrer");
    }
    if (policy) result.headers.set("Content-Security-Policy", policy);
    return result;
  };
  let response = secure(NextResponse.next({ request }));
  if (request.nextUrl.pathname === "/api/health" || request.nextUrl.pathname === "/auth/callback") return response;
  // Recover a PKCE response sent to the Site URL instead of the callback.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", request.nextUrl.searchParams.get("code")!);
    callback.searchParams.set("next", "/dashboard");
    const redirect = NextResponse.redirect(callback);
    redirect.headers.set("Cache-Control", "private, no-store");
    redirect.headers.set("Referrer-Policy", "no-referrer");
    return secure(redirect);
  }

  const config = getSupabaseConfig();
  if (!config) return response;

  try {
    const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      return fetch(input, {
        ...init,
        signal: init?.signal ?? controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    };

    const supabase = createServerClient(config.url, config.key, {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = secure(NextResponse.next({ request }));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, authCookieOptions(name, options))
          );
          // Supabase SSR supplies anti-cache headers whenever it refreshes tokens.
          Object.entries(headers ?? {}).forEach(([name, value]) => response.headers.set(name, value));
          response.headers.set("Referrer-Policy", "no-referrer");
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
      return secure(loginResponse);
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
