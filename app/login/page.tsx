import Link from "next/link";
import {login} from "@/app/auth/actions";
import {GoogleSignInButton} from "@/components/GoogleSignInButton";
import {AuthLayout} from "@/components/AuthLayout";
import {PasswordField,AuthSubmit} from "@/components/AuthFormControls";
import styles from "@/components/AuthLayout.module.css";
export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string;message?:string;next?:string}>}) {
 const params=await searchParams;
 return <AuthLayout><p className={styles.kicker}>PICK UP WHERE YOU LEFT OFF</p><h1 className={styles.title}>Welcome back.</h1><p className={styles.subtitle}>Your next milestone is waiting for you.</p>
 {params.message && <div className={styles.notice} role="status">{params.message}</div>}{params.error && <div className={styles.error} role="alert">{params.error}</div>}
 <GoogleSignInButton nextParam={params.next} className={styles.google}/><div className={styles.divider}><span>or sign in with email</span></div>
 <form action={login} className={styles.form}><div><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com"/></div>
 <div><div className={styles.labelRow}><label htmlFor="password">Password</label><Link href="/forgot-password">Forgot password?</Link></div><PasswordField/></div><AuthSubmit/></form>
 <p className={styles.afterForm}>A fresh start? <Link href="/signup">Build your learning path</Link></p></AuthLayout>;
}
