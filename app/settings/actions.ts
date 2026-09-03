"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AVATAR_OPTIONS } from "@/lib/profile/avatars";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const avatarId = String(formData.get("avatarId") ?? "");

  // Never trust a client-submitted avatarId as-is — validate against
  // the real catalog server-side, same as any other enum input. Worst
  // case of skipping this is cosmetic (getAvatarEmoji already falls
  // back gracefully), but storing arbitrary unvalidated strings in a
  // column meant to be an enum is the kind of small looseness that
  // compounds into real bugs later.
  const isValidAvatar = AVATAR_OPTIONS.some((a) => a.id === avatarId);
  if (!isValidAvatar) {
    redirect("/settings?error=Invalid avatar selection");
  }
  if (!displayName || displayName.length > 100) {
    redirect("/settings?error=Name must be between 1 and 100 characters");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, avatar_id: avatarId })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("avatar_id")) {
      const { error: fallbackErr } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);
      if (fallbackErr) {
        redirect(`/settings?error=${encodeURIComponent(fallbackErr.message)}`);
      }
    } else {
      redirect(`/settings?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
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
  const password = String(formData.get("password") ?? "");
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });
  if (verifyError) {
    redirect("/settings?error=Incorrect password — account not deleted");
  }

  // Deleting the auth.users row cascades to profiles (FK: profiles.id
  // references auth.users(id) on delete cascade) and from there to
  // every learning_paths/stages/stage_resources/stage_progress/
  // resource_ratings row already, per schema.sql — this one call is
  // enough, no manual per-table cleanup needed. Requires the service
  // role: deleting an auth user is an admin-level operation, not
  // something the user's own session can do directly.
  const service = createServiceClient();
  const { error } = await service.auth.admin.deleteUser(user.id);

  if (error) {
    redirect(`/settings?error=${encodeURIComponent("Failed to delete account: " + error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/login?message=Your account has been deleted.");
}
