"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getSiteUrl } from "@/lib/site";
import { safeRedirectPath } from "@/lib/security/validation";

export async function googleSignIn(_previous: {error: string} | null, form: FormData): Promise<{error: string} | null> {
  const unavailable = {error: "Google sign-in is unavailable. Please try again."};
  const config = getSupabaseConfig();
  if (!config) return unavailable;
  let destination: string;
  try {
    const next = safeRedirectPath(form.get("next"));
    const callback = new URL("/auth/callback", getSiteUrl());
    callback.searchParams.set("next", next);
    const client = await createClient();
    const {data, error} = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        // The server redirects below; omit skip_http_redirect so /authorize redirects to Google.
        skipBrowserRedirect: false,
        queryParams: {access_type: "offline", prompt: "consent"},
      },
    });
    if (error || !data.url) return unavailable;
    const target = new URL(data.url);
    if (target.origin !== config.url || target.pathname !== "/auth/v1/authorize" || target.searchParams.has("apikey") || data.url.includes(config.key)) return unavailable;
    destination = target.toString();
  } catch { return unavailable; }
  // Redirect is control flow, not an authentication failure.
  redirect(destination);
}
