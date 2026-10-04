import { validCountry } from "@/lib/profile/residence";
import { safeRedirectPath } from "@/lib/security/validation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/site";

// Handles the redirect Supabase sends the user to after they click the
// confirmation link in the signup email.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error_description") || searchParams.get("error");
  const next = searchParams.get("next") ?? "/dashboard";

  const safeNext = safeRedirectPath(next);

  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (code) {
    const supabase = await createClient({next:safeNext});
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google, email confirmation and password recovery use the same MFA boundary.
      await supabase.auth.getUser();
      if (data.user && !validCountry(data.user.user_metadata?.country_of_residence)) {
        return NextResponse.redirect(`${origin}/complete-profile?next=${encodeURIComponent(safeNext)}`);
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    } else {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message || "Could not confirm account")}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid+authentication+callback`);
}
