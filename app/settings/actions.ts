"use server";

import { cookies } from "next/headers";
import { validCountry, residenceCurrency } from "@/lib/profile/residence";
import { CURRENCY_COOKIE } from "@/lib/currency/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AVATAR_OPTIONS } from "@/lib/profile/avatars";
import { logError } from "@/lib/monitoring/log-error";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const avatarId = String(formData.get("avatarId") ?? "");

  const isValidAvatar = AVATAR_OPTIONS.some((a) => a.id === avatarId);
  if (!isValidAvatar) {
    redirect("/settings?error=Invalid avatar selection");
  }
  if (!displayName || displayName.length > 100) {
    redirect("/settings?error=Name must be between 1 and 100 characters");
  }

  // 1. Always persist avatar_id and display_name in Supabase Auth user metadata
  const { error: authErr } = await supabase.auth.updateUser({
    data: {
      avatar_id: avatarId,
      display_name: displayName,
    },
  });

  if (authErr) {
    await logError("updateProfile:auth", authErr);
    redirect("/settings?error=Could not save your profile. Please try again.");
  }

  // 2. Persist in profiles table using service client (bypasses schema cache/RLS limits)
  const service = createServiceClient();
  const { error: dbErr } = await service
    .from("profiles")
    .update({ display_name: displayName, avatar_id: avatarId })
    .eq("id", user.id).select("id").single();

  if (dbErr) {
    await logError("updateProfile:database", dbErr);
    redirect("/settings?error=Your account details changed, but the profile could not be updated. Please save again.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Re-verify the password before a destructive, irreversible action —
  // an active session alone (e.g. a left-open browser tab) shouldn't be
  // enough to delete an account.
  if (formData.get("deleteConfirm") !== "DELETE") redirect("/settings?error=Type DELETE to confirm account deletion");
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("emailCode") ?? "").trim();
  if (!user.email) redirect("/settings?error=A verified email is required to delete this account");
  const verification = code
    ? await supabase.auth.verifyOtp({email:user.email,token:code,type:"email"})
    : await supabase.auth.signInWithPassword({email:user.email,password});
  if (verification.error || verification.data.user?.id !== user.id) {
    redirect("/settings?error=Verification failed. Your account has not been deleted.");
  }

  // Deleting the auth.users row cascades to profiles (FK: profiles.id
  // references auth.users(id) on delete cascade) and from there to
  // every learning_paths/stages/stage_resources/stage_progress/
  // resource_ratings row already, per schema.sql — this one call is
  // enough, no manual per-table cleanup needed. Requires the service
  // role: deleting an auth user is an admin-level operation, not
  // something the user's own session can do directly.
  // Revoke refresh sessions before deleting the identity. Existing access JWTs
  // expire normally; protected actions also validate the user with getUser().
  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    redirect("/settings?error=Could not revoke your sessions. Your account has not been deleted.");
  }
  const service = createServiceClient();
  const { error } = await service.auth.admin.deleteUser(user.id);

  if (error) {
    await logError("deleteAccount", error);
    redirect("/login?error=Account deletion failed. Sign in to try again.");
  }

  redirect("/login?message=Your account has been deleted.");
}

export async function updateResidence(form:FormData) {
 const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user) redirect("/login");
 const country=String(form.get("country")||"");if(!validCountry(country))redirect("/settings?error=Choose a valid country of residence");
 const {error}=await client.auth.updateUser({data:{country_of_residence:country}}).catch(()=>({error:true}));
 if(error)redirect("/settings?error=Could not save your residence. Please try again.");
 (await cookies()).set(CURRENCY_COOKIE,residenceCurrency(country),{path:"/",maxAge:31536000,sameSite:"lax",secure:process.env.NODE_ENV==="production"});
 revalidatePath("/","layout");redirect("/settings?saved=1");
}

/** Email OTP supports accounts created with Google and no local password. */
export async function requestDeletionCode() {
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)redirect("/login");
 if(!user.email || !user.email_confirmed_at)redirect("/settings?error=Verify your email before requesting account deletion");
 const {error}=await client.auth.signInWithOtp({email:user.email,options:{shouldCreateUser:false}});
 if(error)redirect("/settings?error=Could not send a verification code. Please wait before trying again.");
 redirect("/settings?deletionCodeSent=1#account");
}

export async function updateReminderPreference(form:FormData) {
 const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user)redirect("/login");
 const {error}=await client.auth.updateUser({data:{weekly_reminders:form.get("weeklyReminders")==="on"}});
 if(error)redirect("/settings?error=Could not update reminder preferences");
 revalidatePath("/settings");redirect("/settings?saved=1");
}
