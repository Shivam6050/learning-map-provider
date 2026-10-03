import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResidenceFields } from "@/components/ResidenceFields";
import { completeProfile } from "./actions";
import { safeRedirectPath } from "@/lib/security/validation";
export default async function CompleteProfile({searchParams}:{searchParams:Promise<{next?:string;error?:string}>}) {
 const params=await searchParams;
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)redirect("/login?"+new URLSearchParams({next:"/complete-profile?"+new URLSearchParams({next:safeRedirectPath(params.next || "/dashboard")}).toString()}).toString());
 return <main className="mx-auto max-w-xl px-6 py-16"><p className="text-sm uppercase tracking-widest text-lime-200">One last detail</p><h1 className="mt-3 text-3xl font-semibold">Make your learning path local.</h1><p className="mt-4 text-slate-300">Tell us where you live so we can match available offers and your preferred currency.</p>
 {params.error && <p role="alert" className="mt-4 text-red-300">{params.error}</p>}
 <form action={completeProfile} className="mt-8 space-y-6"><input type="hidden" name="next" value={safeRedirectPath(params.next || "/dashboard")}/><ResidenceFields showPhone={false} defaultCountry={user.user_metadata?.country_of_residence || ""}/>
 <label className="flex gap-3 text-sm"><input type="checkbox" name="acceptTerms" required/> <span>I accept the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</span></label>
 <button className="rounded-xl bg-lime-100 px-6 py-3 font-semibold text-slate-950">Continue to my learning space</button></form></main>;
}
