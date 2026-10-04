import Link from "next/link";
import { updatePasswordAfterReset } from "@/app/auth/actions";
import { AuthLayout } from "@/components/AuthLayout";
import { PasswordField, AuthSubmit } from "@/components/AuthFormControls";
import styles from "@/components/AuthLayout.module.css";

export default async function ResetPasswordPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <AuthLayout>
    <p className={styles.kicker}>SECURE YOUR NEXT CHAPTER</p>
    <h1 className={styles.title}>Make it a new start.</h1>
    <p className={styles.subtitle}>Choose a new password, then pick up where you left off.</p>
    {params.error && <div className={styles.error} role="alert">{params.error}</div>}
    <form action={updatePasswordAfterReset} className={styles.form}>
      <div><label htmlFor="password">New password</label>
        <PasswordField signup />
        <p id="password-help" className={styles.hint}>Use 8–128 characters. Choose a unique passphrase; we check it against known breaches.</p>
      </div>
      <AuthSubmit label="Save password & continue" pendingLabel="Saving your password…" />
    </form><p className={styles.hint}>Password safety checks powered by <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noreferrer">Have I Been Pwned</a>. We never send your password.</p>
    <div className={styles.recoveryHelp}>
      <h2>Link expired?</h2>
      <p>Request a fresh reset link and open the most recent email.</p>
      <Link href="/forgot-password">Request a new link <span aria-hidden="true">→</span></Link>
    </div>
    <p className={styles.afterForm}><Link href="/login">Back to sign in</Link></p>
  </AuthLayout>;
}
