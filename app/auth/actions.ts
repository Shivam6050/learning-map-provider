"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const displayName = String(formData.get("displayName") ?? "");

  let errorMessage: string | null = null;

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      errorMessage = error.message;
    }
  } catch (err: any) {
    const rawMsg = err?.message || "";
    if (rawMsg.includes("fetch failed") || rawMsg.includes("ENOTFOUND")) {
      errorMessage = "Supabase connection failed. Please add your valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local";
    } else {
      errorMessage = rawMsg || "Failed to sign up. Check your Supabase configuration in .env.local.";
    }
  }

  if (errorMessage) {
    redirect(`/signup?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/login?message=Check your email to confirm your account");
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  let errorMessage: string | null = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      errorMessage = error.message;
    }
  } catch (err: any) {
    const rawMsg = err?.message || "";
    if (rawMsg.includes("fetch failed") || rawMsg.includes("ENOTFOUND")) {
      errorMessage = "Supabase connection failed. Please add your valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local";
    } else {
      errorMessage = rawMsg || "Failed to log in. Check your Supabase configuration in .env.local.";
    }
  }

  if (errorMessage) {
    redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
