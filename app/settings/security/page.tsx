import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { verifiedFactors } from "@/lib/auth/mfa";
import { AuthenticatorSetup, RemoveAuthenticator } from "@/components/AuthenticatorForms";
import styles from "./security.module.css";
export const metadata:Metadata = {title:"Sign-in security | LearningMap",robots:{index:false,follow:false}};
export default async function SecurityPage({searchParams}:{searchParams:Promise<{status?:string;error?:string}>}) {
 const client=await createClient({next:"/settings/security"}); const {data:{user},error}=await client.auth.getUser();
 if(!user || error) redirect("/login?next=%2Fsettings%2Fsecurity");
 const params=await searchParams;
 const factors=verifiedFactors(user).filter(f=>f.factor_type==="totp").map(f=>({id:f.id,name:f.friendly_name||"Authenticator"}));
 const message=params.status==="enabled" ? "Two-step verification is enabled. Your authenticator is ready." : params.status==="removed" ? "Authenticator removed." : params.status==="cancelled" ? "Setup cancelled. Your existing sign-in settings are unchanged." : null;
 return <div className={styles.page}><div className={styles.layout}>
  <aside className={styles.aside}><Link href="/settings" className={styles.back}>← Account settings</Link><p className={styles.eyebrow}>YOUR ACCOUNT, PROTECTED</p><h1>A second step.<br/>More peace of mind.</h1><p>An authenticator adds a code that changes every 30 seconds. No text messages, fees or phone number required.</p></aside>
  <div>{message && <p className={styles.badge} role="status">{message}</p>}{params.error && <p className={styles.error} role="alert">{params.error}</p>}
   <section className={styles.card}><span className={styles.badge}>{factors.length ? "Two-step verification on" : "Optional · Free"}</span><h2>Your authenticators</h2><p>{factors.length ? "After signing in, enter a code from one of these devices to access your learning space." : "Start with your usual email or Google sign-in, then verify a code from your authenticator app."}</p>
    {factors.map(f=><div key={f.id}><div className={styles.device}><strong>{f.name}</strong><small>Verified</small></div><RemoveAuthenticator factor={f} factors={factors}/></div>)}
    {factors.length<2 && <AuthenticatorSetup key={(params.status||"")+factors.map(f=>f.id).join(",")} backup={factors.length>0}/>}
   </section>
   <section className={styles.card}><p className={styles.eyebrow}>KEEP YOUR WAY BACK IN</p><h2>Make room for a backup.</h2><p>Add a second authenticator or securely back up your authenticator app before replacing your phone. Your backup can verify sign-in and remove a lost device.</p><p className={styles.hint}>A password-reset email does not disable MFA. If every authenticator is lost, account recovery requires support and identity verification; there is no email-only bypass.</p></section>
  </div>
 </div></div>;
}
