import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { needsMfa, mfaDestination, verifiedFactors } from "@/lib/auth/mfa";
import { AuthenticatorChallenge } from "@/components/AuthenticatorForms";
import { logout } from "@/app/auth/actions";
import styles from "@/app/settings/security/security.module.css";
export const metadata:Metadata = {title:"Verify your authenticator | LearningMap",robots:{index:false,follow:false}};
export default async function MfaPage({searchParams}:{searchParams:Promise<{next?:string}>}) {
 const next=mfaDestination((await searchParams).next);
 const client=await createClient({allowMfaChallenge:true});const {data:{user},error}=await client.auth.getUser();
 if(!user || error) redirect("/login?"+new URLSearchParams({next}));
 if(!await needsMfa(client,user)) redirect(next);
 const factors=verifiedFactors(user).filter(f=>f.factor_type==="totp").map(f=>({id:f.id,name:f.friendly_name||"Authenticator"}));
 return <div className={styles.page}><section className={styles.challenge}>
   <p className={styles.eyebrow}>ONE MORE STEP, JUST FOR YOU</p><h1>Confirm it’s you.</h1><p>Open your authenticator app and enter the current six-digit code to continue to your learning space.</p>
   {factors.length ? <AuthenticatorChallenge factors={factors} next={next}/> : <p className={styles.error} role="alert">No supported authenticator is available. Contact support to recover access securely.</p>}
   <div className={styles.help}><p>Use your backup authenticator if your usual device is unavailable. Resetting your password does not remove two-step verification. If every device is lost, contact support to discuss identity verification; recovery is not automatic.</p><p><a href="mailto:60shivam50@gmail.com" className={styles.back}>Contact LearningMap support</a></p><form action={logout}><button className={styles.secondary}>Sign out & use another account</button></form></div>
 </section></div>;
}
