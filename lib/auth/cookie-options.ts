import type { CookieOptions } from "@supabase/ssr";

/**
 * Session access is server-side. OAuth's browser-created PKCE verifier must
 * remain readable until the callback exchanges it; it is not a session token.
 */
export function authCookieOptions(name: string, options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: !/-code-verifier(?:\.\d+)?$/.test(name),
    secure: process.env.NODE_ENV === "production" || options.secure === true,
    sameSite: "lax",
    path: "/",
  };
}
