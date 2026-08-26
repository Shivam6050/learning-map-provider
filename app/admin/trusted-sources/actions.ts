"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Both actions write via the user's OWN session, not the service role.
 * The trusted_sources_admin_write RLS policy (using public.is_admin())
 * is what actually enforces that only an admin can succeed here — a
 * non-admin hitting this action gets 0 rows affected, not a bypass.
 * That's defense in depth: the UI hides this page from non-admins, but
 * the database doesn't trust the UI to be the only thing enforcing it.
 */

export async function approveTrustedSource(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("trusted_sources")
    .update({ approved: true })
    .eq("id", id);

  if (error) throw new Error(`Failed to approve source: ${error.message}`);

  revalidatePath("/admin/trusted-sources");
}

export async function rejectTrustedSource(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));

  const { error } = await supabase.from("trusted_sources").delete().eq("id", id);

  if (error) throw new Error(`Failed to reject source: ${error.message}`);

  revalidatePath("/admin/trusted-sources");
}
