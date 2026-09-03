"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Deletes a learning_paths row. Cascades handle the rest: stages,
 * stage_resources, and stage_progress all have `on delete cascade`
 * back to their parent (see schema.sql) — deleting the path is enough,
 * no manual cleanup of child rows needed. RLS's learning_paths_owner_all
 * policy (which covers delete, not just select/insert) means this only
 * ever affects a path the current user actually owns.
 */
export async function deletePath(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const pathId = String(formData.get("pathId"));

  const { error } = await supabase.from("learning_paths").delete().eq("id", pathId);

  if (error) {
    throw new Error(`Failed to delete path: ${error.message}`);
  }

  revalidatePath("/dashboard");
}
