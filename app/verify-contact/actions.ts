"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contactVerificationEnabled } from "@/lib/auth/contact-verification";
import { internationalPhone, validCountry, residenceCurrency } from "@/lib/profile/residence";
import { CURRENCY_COOKIE } from "@/lib/currency/format";
function fail(message:string):never { redirect("/verify-contact?error="+encodeURIComponent(message)); }
function enabled() { if (!contactVerificationEnabled()) fail("Mobile verification is not enabled yet."); }
export async function verifyEmail(form:FormData) {
 enabled(); const jar=await cookies();const email=jar.get("learning-map-pending-email")?.value;
 const token=String(form.get("token")||"").trim();
 if (!email || !/^\d{6,10}$/.test(token)) fail("Enter the code from your signup email, or restart signup if it expired.");
 const client=await createClient();
 const {error}=await client.auth.verifyOtp({email,token,type:"signup"}).catch(()=>({error:true}));
 if(error) fail("The code is invalid or expired. Request a new code and try again.");
 jar.delete("learning-map-pending-email");redirect("/verify-contact");
}
export async function resendEmail() {
 enabled(); const email=(await cookies()).get("learning-map-pending-email")?.value;
 if(!email) fail("Restart signup to request a new confirmation email.");
 const client=await createClient();const {error}=await client.auth.resend({type:"signup",email}).catch(()=>({error:true}));
 if(error) fail("We could not resend yet. Wait a minute before trying again.");
 redirect("/verify-contact?message=Check your email for the new code.");
}
export async function sendPhoneCode(form:FormData) {
 enabled();const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user?.email_confirmed_at) fail("Verify your email before requesting an SMS code.");
 const phone=internationalPhone(String(form.get("phone")||""));const country=String(form.get("country")||"");
 if(!phone || !validCountry(country)) fail("Choose your residence and enter a valid international phone number.");
 const {error}=await client.auth.updateUser({phone,data:{country_of_residence:country}}).catch(()=>({error:true}));
 if(error) fail("SMS could not be sent. Check the number or wait a minute before retrying.");
 const jar=await cookies();
 jar.set(CURRENCY_COOKIE,residenceCurrency(country),{path:"/",maxAge:31536000,sameSite:"lax",secure:process.env.NODE_ENV==="production"});
 redirect("/verify-contact?message=Enter the code sent to your phone.");
}
export async function verifyPhone(form:FormData) {
 enabled();const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user?.email_confirmed_at || !user.new_phone) fail("Request a phone code first.");
 const token=String(form.get("token")||"").trim();if(!/^\d{6,10}$/.test(token)) fail("Enter the code from your SMS.");
 const {error}=await client.auth.verifyOtp({phone:user.new_phone,token,type:"phone_change"}).catch(()=>({error:true}));
 if(error) fail("The code is invalid or expired. Request another code and try again.");
 (await cookies()).delete("learning-map-pending-phone");
 redirect("/dashboard");
}
