import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/security/validation";

export function verifiedFactors(user: User) {
  return (user.factors ?? []).filter(f => f.status === "verified");
}
export function mfaDestination(next: unknown) {
  const safe = safeRedirectPath(next);
  // Never return to a challenge or sign-in loop after verification.
  return /^\/(?:auth(?:\/|$)|login(?:\?|$)|signup(?:\?|$))/.test(safe) ? "/dashboard" : safe;
}
export async function needsMfa(client: Pick<SupabaseClient, "auth">, user: User) {
  if (!verifiedFactors(user).length) return false;
  // getUser has already verified this session with Auth. Never trust editable metadata.
  try {
    const result = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    return Boolean(result.error || result.data?.currentLevel !== "aal2");
  } catch {
    return true;
  }
}
export async function enforceMfa(client: Pick<SupabaseClient, "auth">, user: User, next?: string) {
  if (await needsMfa(client, user)) redirect("/auth/mfa?" + new URLSearchParams({next: mfaDestination(next)}));
}
