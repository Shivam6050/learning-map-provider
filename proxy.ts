import { getFieldBySlug } from "@/lib/fields/catalog";
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
  const isPrivateRoute = privatePrefixes.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + "/"));
  const isPrivate = () => isPrivateRoute
    || request.cookies.getAll().some(c => /^sb-.+-auth-token(?:\.\d+)?$/.test(c.name));
  const secure = (result: NextResponse) => {
    // Public pages can also contain the signed-in user's name in the navbar.
    if (isPrivate()) {
      result.headers.set("Cache-Control", "private, no-store");
      result.headers.set("Referrer-Policy", "no-referrer");
    }
    // Indexing policy is route-based, not account-based: public guides stay public.
    if (isPrivateRoute) result.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (policy) result.headers.set("Content-Security-Policy", policy);
    return result;
  };
  // With a dynamic root layout, Next can stream before notFound() sets a status.
  // Reject unknown public guide URLs here to avoid a soft 404 in search engines.
  if (request.nextUrl.pathname.startsWith("/roadmaps/")) {
    let slug = "";
    try { slug = decodeURIComponent(request.nextUrl.pathname.slice("/roadmaps/".length).replace(/\/$/, "")); } catch { /* Invalid encoding is not a supported field. */ }
    if (!getFieldBySlug(slug)) {
      return secure(new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Roadmap not found | LearningMap</title></head><body style="margin:0;background:#f5f3eb;color:#20382b;font-family:system-ui,sans-serif"><main style="max-width:640px;margin:12vh auto;padding:28px"><p style="font-size:12px;letter-spacing:.15em">LEARNINGMAP / 404</p><h1 style="font-family:Georgia,serif;font-size:44px;font-weight:400">This roadmap isn’t here.</h1><p style="line-height:1.8">Explore the supported learning fields to find a direction for your next chapter.</p><a href="/roadmaps" style="display:inline-block;margin-top:18px;padding:14px 20px;border-radius:6px;background:#264b36;color:white">Browse learning roadmaps</a></main></body></html>`, {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=0, must-revalidate" },
      }));
    }
  }
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
