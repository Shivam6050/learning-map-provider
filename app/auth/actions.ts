"use server";

import { cookies } from "next/headers";
import { validCountry, internationalPhone, residenceCurrency } from "@/lib/profile/residence";
import { contactVerificationEnabled } from "@/lib/auth/contact-verification";
import { CURRENCY_COOKIE } from "@/lib/currency/format";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import { AVATAR_OPTIONS } from "@/lib/profile/avatars";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const rawAvatarId = String(formData.get("avatarId") ?? "");
  const country = String(formData.get("country") ?? "");
  const rawPhone = String(formData.get("phone") ?? "");
  const phone = internationalPhone(rawPhone);
  if (!validCountry(country)) redirect("/signup?error=Select your country of residence");
  if ((rawPhone || contactVerificationEnabled()) && !phone) redirect("/signup?error=Enter a valid mobile number including its country calling code");
  const acceptedTerms = formData.get("acceptTerms") === "on";

  if (!acceptedTerms) {
    redirect("/signup?error=You must accept the Terms and Privacy Policy");
  }

  if (password.length < 8 || password.length > 128) {
    redirect("/signup?error=Password must be between 8 and 128 characters");
  }
  if (!displayName || displayName.length > 100) {
    redirect("/signup?error=Name must be between 1 and 100 characters");
  }
  const avatarId = AVATAR_OPTIONS.some((a) => a.id === rawAvatarId) ? rawAvatarId : "fox";

  let errorMessage: string | null = null;

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, avatar_id: avatarId, country_of_residence: country },
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      const msg = error.message || String(error);
      errorMessage = (!msg || msg === "{}" || msg === "[object Object]") 
        ? "Supabase service error (502 Bad Gateway). Please check your Supabase project status."
        : msg;
    }
  } catch (err: any) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
    const rawMsg = typeof err === "string" ? err : err?.message || String(err);
    if (!rawMsg || rawMsg === "{}" || rawMsg === "[object Object]" || rawMsg.includes("502")) {
      errorMessage = "Supabase service error (502 Bad Gateway). Please check your Supabase project status.";
    } else if (rawMsg.includes("fetch failed") || rawMsg.includes("ENOTFOUND")) {
      errorMessage = "Supabase connection failed. Please check your network or Supabase project URL.";
    } else {
      errorMessage = rawMsg || "Failed to sign up. Check your Supabase configuration.";
    }
  }

  if (errorMessage) {
    redirect(`/signup?error=${encodeURIComponent(errorMessage)}`);
  }

  const jar = await cookies();
  jar.set(CURRENCY_COOKIE, residenceCurrency(country), {path:"/",maxAge:31536000,sameSite:"lax",secure:process.env.NODE_ENV === "production"});
  if (contactVerificationEnabled()) {
    if (phone) jar.set("learning-map-pending-phone", phone, {httpOnly:true,path:"/",sameSite:"lax",secure:process.env.NODE_ENV === "production",maxAge:1800});
    jar.set("learning-map-pending-email", email, {httpOnly:true,path:"/",sameSite:"lax",secure:process.env.NODE_ENV === "production",maxAge:1800});
    redirect("/verify-contact");
  }
  redirect("/login?message=Check your email to confirm your account");
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let errorMessage: string | null = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error.message || String(error);
      if (msg.toLowerCase().includes("captcha")) {
        errorMessage = "CAPTCHA protection is enabled on your Supabase project. Please complete verification or use Google Sign-In.";
      } else {
        errorMessage = (!msg || msg === "{}" || msg === "[object Object]")
          ? "Supabase service error (502 Bad Gateway). Please check your Supabase project status."
          : msg;
      }
    }
  } catch (err: any) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
    const rawMsg = typeof err === "string" ? err : err?.message || String(err);
    if (rawMsg.toLowerCase().includes("captcha")) {
      errorMessage = "CAPTCHA protection is enabled on your Supabase project. Please complete verification or use Google Sign-In.";
    } else if (!rawMsg || rawMsg === "{}" || rawMsg === "[object Object]" || rawMsg.includes("502")) {
      errorMessage = "Supabase service error (502 Bad Gateway). Please check your Supabase project status.";
    } else if (rawMsg.includes("fetch failed") || rawMsg.includes("ENOTFOUND")) {
      errorMessage = "Supabase connection failed. Please check your network or Supabase project URL.";
    } else {
      errorMessage = rawMsg || "Failed to log in. Check your Supabase configuration.";
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

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
    });
  } catch {
    // Deliberately swallowed: this must not reveal whether an account
    // exists for that email — same generic "sent" message either way,
    // to avoid using this form as an email-enumeration oracle.
  }

  redirect("/forgot-password?sent=1");
}

export async function updatePasswordAfterReset(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password"));

  if (password.length < 8 || password.length > 128) {
    redirect("/reset-password?error=Password must be between 8 and 128 characters");
  }

  // Requires the recovery session established by /auth/callback after
  // the emailed link's code exchange — if that didn't happen, this
  // fails naturally rather than needing a separate check here.
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
