import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { needsMfa } from "@/lib/auth/mfa";

/** React cache deduplicates only within a Server Component render, never across users. */
export const getRenderContext = cache(async () => {
  // Layouts also wrap the challenge page. Avoid redirect loops and hide account
  // details until the independently verified session satisfies its MFA requirement.
  const supabase = await createClient({allowMfaChallenge:true});
  const auth = await supabase.auth.getUser();
  const mfaRequired = Boolean(auth.data.user && await needsMfa(supabase, auth.data.user));
  return { supabase, auth, mfaRequired };
});

export const getRenderProfile = cache(async () => {
  const { supabase, auth, mfaRequired } = await getRenderContext();
  if (!auth.data.user || mfaRequired) return { data: null, error: null };
  return supabase.from("profiles").select("avatar_id, display_name")
    .eq("id", auth.data.user.id).maybeSingle();
});
