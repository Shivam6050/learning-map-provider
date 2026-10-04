import type { CookieOptions } from "@supabase/ssr";

/** Session and PKCE storage are read only by the server. */
export function authCookieOptions(_name: string, options: CookieOptions): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || options.secure === true,
    sameSite: "lax",
    path: "/",
  };
}
