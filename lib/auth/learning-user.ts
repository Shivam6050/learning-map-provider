import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/security/validation";
import type { User } from "@supabase/supabase-js";
import { validCountry } from "@/lib/profile/residence";
import { contactVerificationEnabled, hasVerifiedContacts } from "./contact-verification";
/** Runs at protected server entries, including direct server-action calls. */
export async function getLearningUser<T extends {data:{user:User|null}}>(client: {auth:{getUser:()=>Promise<T>}}, next = "/dashboard") {
 const result=await client.auth.getUser();
 const user=result.data.user;
 if(user && !validCountry(user.user_metadata?.country_of_residence)) redirect("/complete-profile?" + new URLSearchParams({next:safeRedirectPath(next)}).toString());
 if(user && contactVerificationEnabled() && !hasVerifiedContacts(user)) redirect("/verify-contact");
 return result;
}
