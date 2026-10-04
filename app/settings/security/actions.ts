"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { enforceMfa, mfaDestination, verifiedFactors } from "@/lib/auth/mfa";
import { requireUuid } from "@/lib/security/validation";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type EnrollmentState = {error?:string; setup?:{id:string; qr:string; secret:string}};
export type VerificationState = {error?:string};

async function identity(client: SupabaseClient): Promise<User> {
  const {data:{user},error}=await client.auth.getUser();
  if(error || !user || user.is_anonymous || !user.email_confirmed_at) redirect("/login?error=Sign%20in%20with%20a%20verified%20email%20to%20manage%20security");
  return user;
}
function id(value: FormDataEntryValue | null) { try { return requireUuid(String(value ?? "")); } catch { return null; } }
function code(form: FormData) { const value=String(form.get("code") ?? "").trim(); return /^\d{6}$/.test(value) ? value : null; }

export async function startAuthenticator(_previous: EnrollmentState, form: FormData): Promise<EnrollmentState> {
  const client=await createClient(); const user=await identity(client);
  if(verifiedFactors(user).length>=2) return {error:"Keep up to two authenticators. Remove one before adding another."};
  const label=String(form.get("label") ?? "").trim();
  if(!label || label.length>40 || /[\u0000-\u001f\u007f]/.test(label)) return {error:"Name your authenticator using 1–40 characters."};
  // Remove only the owner's abandoned, unverified setups. Verified devices are untouched.
  for(const factor of user.factors ?? []) if(factor.status==="unverified" && factor.factor_type==="totp") {
    const removed=await client.auth.mfa.unenroll({factorId:factor.id});
    if(removed.error) return {error:"Could not clear the unfinished setup. Please retry."};
  }
  const {data,error}=await client.auth.mfa.enroll({factorType:"totp",friendlyName:label,issuer:"LearningMap"});
  if(error || !data) return {error:"Could not start authenticator setup. Check that TOTP is enabled in Supabase, then retry."};
  const qr=data.totp.qr_code.startsWith("data:image/svg+xml;")
    ? data.totp.qr_code : "data:image/svg+xml;base64,"+Buffer.from(data.totp.qr_code).toString("base64");
  return {setup:{id:data.id,qr,secret:data.totp.secret}};
}
export async function confirmAuthenticator(_previous: VerificationState, form: FormData): Promise<VerificationState> {
  const client=await createClient(); const user=await identity(client);
  const factorId=id(form.get("factorId")), value=code(form);
  if(!factorId || !user.factors?.some(f=>f.id===factorId && f.factor_type==="totp" && f.status==="unverified"))
    return {error:"This setup is unavailable. Start a new authenticator setup."};
  if(!value) return {error:"Enter the six-digit code from your authenticator."};
  const {error}=await client.auth.mfa.challengeAndVerify({factorId,code:value});
  if(error) return {error:"That code could not be verified. Use the current code and try again."};
  revalidatePath("/","layout"); redirect("/settings/security?status=enabled");
}
export async function cancelAuthenticator(form: FormData) {
  const client=await createClient(); const user=await identity(client);
  const factorId=id(form.get("factorId"));
  if(factorId && user.factors?.some(f=>f.id===factorId && f.status==="unverified" && f.factor_type==="totp")) {
    const {error}=await client.auth.mfa.unenroll({factorId});
    if(error) redirect("/settings/security?error=Could%20not%20cancel%20setup.%20Please%20retry.");
  }
  redirect("/settings/security?status=cancelled");
}
export async function removeAuthenticator(_previous: VerificationState, form: FormData): Promise<VerificationState> {
  const client=await createClient(); const user=await identity(client);
  const factorId=id(form.get("factorId")), verificationId=id(form.get("verificationFactorId")), value=code(form);
  const factors=verifiedFactors(user).filter(f=>f.factor_type==="totp");
  if(!factorId || !verificationId || !factors.some(f=>f.id===factorId) || !factors.some(f=>f.id===verificationId))
    return {error:"Choose an authenticator on your own account."};
  if(form.get("confirmRemoval")!=="on" || !value) return {error:"Confirm removal and enter a current authenticator code."};
  const verified=await client.auth.mfa.challengeAndVerify({factorId:verificationId,code:value});
  if(verified.error) return {error:"That code could not be verified. The authenticator has not been removed."};
  const {error}=await client.auth.mfa.unenroll({factorId});
  if(error) return {error:"Could not remove the authenticator. Please retry."};
  const refreshed=await client.auth.refreshSession();
  if(refreshed.error) redirect("/login?message=Authenticator%20removed.%20Please%20sign%20in%20again.");
  revalidatePath("/","layout"); redirect("/settings/security?status=removed");
}
export async function verifyAuthenticator(_previous: VerificationState, form: FormData): Promise<VerificationState> {
  // The sole bootstrap exception: a lower-assurance session can submit its own MFA code.
  const client=await createClient({allowMfaChallenge:true}); const user=await identity(client);
  const factorId=id(form.get("factorId")), value=code(form);
  if(!factorId || !verifiedFactors(user).some(f=>f.id===factorId && f.factor_type==="totp"))
    return {error:"Choose a verified authenticator on your own account."};
  if(!value) return {error:"Enter the six-digit code from your authenticator."};
  const {error}=await client.auth.mfa.challengeAndVerify({factorId,code:value});
  if(error) return {error:"That code could not be verified. Use the current code and try again."};
  // Independently confirm the upgraded session before allowing navigation.
  const updated=await client.auth.getUser();
  if(!updated.data.user || updated.error) return {error:"Could not confirm your session. Please sign in again."};
  const next=mfaDestination(form.get("next"));
  await enforceMfa(client,updated.data.user,next);
  revalidatePath("/","layout"); redirect(next);
}
