"use server";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {validCountry,residenceCurrency} from "@/lib/profile/residence";
import {CURRENCY_COOKIE} from "@/lib/currency/format";
import {safeRedirectPath} from "@/lib/security/validation";
export async function completeProfile(form:FormData) {
 const next=safeRedirectPath(String(form.get("next") || "/dashboard"));
 const returnTo="/complete-profile?"+new URLSearchParams({next}).toString();
 const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user)redirect("/login?"+new URLSearchParams({next:returnTo}).toString());
 const country=String(form.get("country") || "");
 if(!validCountry(country) || form.get("acceptTerms")!=="on")redirect("/complete-profile?"+new URLSearchParams({next,error:"Select your country and accept the terms"}).toString());
 const {error}=await client.auth.updateUser({data:{country_of_residence:country,terms_accepted_at:new Date().toISOString()}});
 if(error)redirect("/complete-profile?"+new URLSearchParams({next,error:"Could not save your details. Please try again."}).toString());
 (await cookies()).set(CURRENCY_COOKIE,residenceCurrency(country),{path:"/",maxAge:31536000,sameSite:"lax",secure:process.env.NODE_ENV==="production"});
 redirect(next);
}
