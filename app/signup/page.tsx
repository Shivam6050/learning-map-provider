import { CountryPicker } from "@/components/CountryPicker";
import Link from "next/link";
import {signup} from "@/app/auth/actions";
import {GoogleSignInButton} from "@/components/GoogleSignInButton";
import {AuthLayout} from "@/components/AuthLayout";
import {PasswordField,AuthSubmit} from "@/components/AuthFormControls";
import {contactVerificationEnabled} from "@/lib/auth/contact-verification";
import {countryOptions} from "@/lib/profile/residence";
import {AVATAR_OPTIONS} from "@/lib/profile/avatars";
import {ProfileAvatar} from "@/components/ProfileAvatar";
import styles from "@/components/AuthLayout.module.css";
export default async function SignupPage({searchParams}:{searchParams:Promise<{error?:string;next?:string}>}) {
 const params=await searchParams;
 return <AuthLayout signup><p className={styles.kicker}>MAKE SPACE FOR WHAT’S NEXT</p><h1 className={styles.title}>Start with possibility.</h1><p className={styles.subtitle}>Create your free account. We’ll help you find your way.</p>
 {params.error && <div className={styles.error} role="alert">{params.error}</div>}
 <GoogleSignInButton nextParam={params.next} className={styles.google}/><div className={styles.divider}><span>or create an account with email</span></div>
 <form action={signup} className={styles.form}>
 <div><label htmlFor="displayName">Your name</label><input id="displayName" name="displayName" autoComplete="name" required maxLength={100} placeholder="How should we call you?"/></div>
 <div><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com"/><p className={styles.hint}>We’ll send a confirmation email to verify your account.</p></div>
 <div><label htmlFor="password">Password</label><PasswordField signup/><p id="password-help" className={styles.hint}>Use at least 8 characters.</p></div>
 <div><CountryPicker countries={countryOptions()}/><p id="country-help" className={styles.hint}>Helps us match regional offers and set your display currency.</p></div>
 {contactVerificationEnabled() && <div><label htmlFor="phone">Mobile number</label><input id="phone" name="phone" type="tel" autoComplete="tel" required maxLength={40} placeholder="+91 98765 43210"/><p className={styles.hint}>Include your country calling code. We’ll verify it by SMS.</p></div>}
 <details className={styles.personalise}><summary>Choose your companion <span>Optional</span></summary><fieldset><legend className={styles.hint}>A small touch of personality. Change it anytime in Settings.</legend><div className={styles.avatars}>{AVATAR_OPTIONS.map((avatar,i)=><label key={avatar.id}><input type="radio" name="avatarId" value={avatar.id} defaultChecked={i===0}/><span><ProfileAvatar id={avatar.id} size={36}/><small>{avatar.label}</small></span></label>)}</div></fieldset></details>
 <label className={styles.terms}><input id="acceptTerms" name="acceptTerms" type="checkbox" required/><span>I agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label><AuthSubmit signup/>
 </form><p className={styles.afterForm}>Already found your direction? <Link href="/login">Sign in</Link></p></AuthLayout>;
}
