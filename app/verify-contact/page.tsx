import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { contactVerificationEnabled, hasVerifiedContacts } from "@/lib/auth/contact-verification";
import { ResidenceFields } from "@/components/ResidenceFields";
import { verifyEmail, resendEmail, sendPhoneCode, verifyPhone } from "./actions";
export default async function VerifyContact({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}) {
 const params=await searchParams;const client=await createClient();const {data:{user}}=await client.auth.getUser();
 const enabled=contactVerificationEnabled();
 if(enabled && hasVerifiedContacts(user)) redirect("/dashboard");
 const pending=(await cookies()).get("learning-map-pending-email")?.value;
 const emailVerified=Boolean(user?.email_confirmed_at);
 const code=<><label htmlFor="token">Verification code</label><input id="token" name="token" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,10}" maxLength={10} required className="block w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"/></>;
 return <main className="mx-auto max-w-lg px-5 py-14"><section className="glass-card rounded-2xl p-8 space-y-5"><p className="text-xs uppercase tracking-widest text-slate-400">Secure your learning account</p><h1 className="text-3xl font-serif">Verify your contact details</h1>
 {params.error && <p role="alert" className="text-red-300">{params.error}</p>}{params.message && <p role="status">{params.message}</p>}
 {!enabled ? <><p>Mobile verification is being prepared. You can continue using email confirmation for now.</p><Link href="/dashboard">Continue to your dashboard</Link></> : !emailVerified ? pending ? <><p>First, enter the code from your signup email.</p><form action={verifyEmail} className="space-y-4">{code}<button className="btn-primary px-5 py-3">Verify email</button></form><form action={resendEmail}><button className="underline">Resend email code</button></form></> : <p><Link href="/signup">Create an account</Link> or <Link href="/login">sign in</Link> to continue verification.</p> : <><p>Email verified. Now verify your mobile number.</p><form action={sendPhoneCode} className="space-y-4"><ResidenceFields phoneRequired defaultPhone={user?.new_phone || (await cookies()).get("learning-map-pending-phone")?.value || ""} defaultCountry={user?.user_metadata?.country_of_residence || ""}/><button className="btn-primary px-5 py-3">Send SMS code</button></form>{user?.new_phone && <form action={verifyPhone} className="space-y-4">{code}<button className="btn-primary px-5 py-3">Verify mobile number</button></form>}<p className="text-xs text-slate-400">Codes expire. Wait at least a minute before requesting another. Your number is used for verification, not marketing.</p></>}
 </section></main>;
}
