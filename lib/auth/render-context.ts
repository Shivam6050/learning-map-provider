import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** React cache deduplicates only within a Server Component render, never across users. */
export const getRenderContext = cache(async () => {
  const supabase = await createClient();
  const auth = await supabase.auth.getUser();
  return { supabase, auth };
});

export const getRenderProfile = cache(async () => {
  const { supabase, auth } = await getRenderContext();
  if (!auth.data.user) return { data: null, error: null };
  return supabase.from("profiles").select("avatar_id, display_name")
    .eq("id", auth.data.user.id).maybeSingle();
});
