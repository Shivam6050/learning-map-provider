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
        <p id="password-help" className={styles.hint}>Use 8–128 characters. A unique passphrase is easier to remember and harder to guess.</p>
      </div>
      <AuthSubmit label="Save password & continue" pendingLabel="Saving your password…" />
    </form>
    <div className={styles.recoveryHelp}>
      <h2>Link expired?</h2>
      <p>Request a fresh reset link and open the most recent email.</p>
      <Link href="/forgot-password">Request a new link <span aria-hidden="true">→</span></Link>
    </div>
    <p className={styles.afterForm}><Link href="/login">Back to sign in</Link></p>
  </AuthLayout>;
}
