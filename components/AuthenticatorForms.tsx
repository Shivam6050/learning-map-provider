"use client";
import { useActionState } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import { startAuthenticator, confirmAuthenticator, cancelAuthenticator, removeAuthenticator, verifyAuthenticator } from "@/app/settings/security/actions";
import type { EnrollmentState, VerificationState } from "@/app/settings/security/actions";
import styles from "@/app/settings/security/security.module.css";

type Factor = {id:string; name:string};
function Submit({children,pendingText="Checking…"}:{children:React.ReactNode;pendingText?:string}) {
 const {pending}=useFormStatus();
 return <button type="submit" className={styles.primary} disabled={pending} aria-busy={pending}>{pending ? pendingText : children}</button>;
}
function ErrorMessage({error}:{error?:string}) {return error ? <p className={styles.error} role="alert">{error}</p> : null;}
function Code({suffix}:{suffix:string}) {return <div className={styles.field}><label htmlFor={"auth-code-"+suffix}>Authenticator code</label><input id={"auth-code-"+suffix} name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required placeholder="000000" className={styles.code}/></div>;}
export function AuthenticatorSetup({backup=false}:{backup?:boolean}) {
 const [state,start]=useActionState<EnrollmentState,FormData>(startAuthenticator,{});
 const [verification,confirm]=useActionState<VerificationState,FormData>(confirmAuthenticator,{});
 if(!state.setup) return <form action={start} className={styles.form}>
   <ErrorMessage error={state.error}/>
   <div className={styles.field}><label htmlFor="authenticator-label">Device name</label><input id="authenticator-label" name="label" autoComplete="off" maxLength={40} required defaultValue={backup ? "Backup authenticator" : "My authenticator"}/></div>
   <Submit pendingText="Preparing setup…">{backup ? "Add a backup authenticator" : "Set up authenticator"}</Submit>
 </form>;
 return <div className={styles.setup}>
   <p className={styles.step}>01 / SCAN & KEEP A BACKUP</p>
   <p>Scan this code with Google Authenticator, Microsoft Authenticator or your preferred authenticator app.</p>
   <div className={styles.qr}><Image src={state.setup.qr} alt="Scan this private setup code in your authenticator app" width={220} height={220} unoptimized/></div>
   <details className={styles.manual}><summary>Can’t scan? Enter the setup key manually</summary><code>{state.setup.secret}</code><p>Account: LearningMap · Time-based · Six digits</p></details>
   <p className={styles.hint}>Keep a secure backup of your authenticator or add a second device after setup. This key is private; never share it.</p>
   <p className={styles.step}>02 / CONFIRM YOUR FIRST CODE</p>
   <form action={confirm} className={styles.form}>
     <input type="hidden" name="factorId" value={state.setup.id}/><ErrorMessage error={verification.error}/>
     <Code suffix="setup"/><Submit>Enable two-step verification</Submit>
   </form>
   <form action={cancelAuthenticator}><input type="hidden" name="factorId" value={state.setup.id}/><button className={styles.secondary}>Cancel setup</button></form>
 </div>;
}
export function AuthenticatorChallenge({factors,next}:{factors:Factor[];next:string}) {
 const [state,verify]=useActionState<VerificationState,FormData>(verifyAuthenticator,{});
 return <form action={verify} className={styles.form}>
   <input type="hidden" name="next" value={next}/><ErrorMessage error={state.error}/>
   {factors.length===1 ? <input type="hidden" name="factorId" value={factors[0].id}/> : <div className={styles.field}><label htmlFor="challenge-device">Authenticator</label><select id="challenge-device" name="factorId">{factors.map(f=><option value={f.id} key={f.id}>{f.name}</option>)}</select></div>}
   <Code suffix="challenge"/><Submit>Verify & continue</Submit>
 </form>;
}
export function RemoveAuthenticator({factor,factors}:{factor:Factor;factors:Factor[]}) {
 const [state,remove]=useActionState<VerificationState,FormData>(removeAuthenticator,{});
 return <details className={styles.removal}><summary>Remove {factor.name}</summary>
   <p>{factors.length===1 ? "Removing your last authenticator turns off two-step verification." : "You can verify with your backup authenticator to remove a lost device."}</p>
   <form action={remove} className={styles.form}>
    <input type="hidden" name="factorId" value={factor.id}/><ErrorMessage error={state.error}/>
    <div className={styles.field}><label htmlFor={"verification-"+factor.id}>Verify using</label><select id={"verification-"+factor.id} name="verificationFactorId" defaultValue={factor.id}>{factors.map(f=><option value={f.id} key={f.id}>{f.name}</option>)}</select></div>
    <Code suffix={factor.id}/><label className={styles.confirm}><input name="confirmRemoval" type="checkbox" required/> I understand and want to remove this authenticator.</label>
    <Submit>Verify & remove authenticator</Submit>
   </form>
 </details>;
}
