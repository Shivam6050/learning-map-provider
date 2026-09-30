import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthSubmit } from "@/components/AuthFormControls";
import styles from "@/components/AuthLayout.module.css";

export default async function ForgotPasswordPage({ searchParams }: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  return <AuthLayout>
    <p className={styles.kicker}>ACCOUNT RECOVERY</p>
    <h1 className={styles.title}>{sent ? "Check your inbox." : "A fresh start."}</h1>
    <p className={styles.subtitle}>{sent
      ? "Your next step is in your email."
      : "Forgot your password? Let’s get you back to your learning path."}</p>
    {sent && <div className={styles.notice} role="status">
      <strong>Reset link requested</strong><br />
      If an account exists for that email, a password-reset link is on its way. Check your inbox and spam folder, then follow the link to choose a new password.
    </div>}
    {params.error && <div className={styles.error} role="alert">{params.error}</div>}
    {sent ? <div className={styles.recoveryHelp}>
      <h2>Still waiting?</h2>
      <p>Allow a few minutes for delivery. If you entered the wrong address, you can request another link.</p>
      <Link href="/forgot-password">Try another email <span aria-hidden="true">→</span></Link>
    </div> : <form action={requestPasswordReset} className={styles.form}>
      <div><label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required placeholder="you@example.com" aria-describedby="reset-email-help" />
        <p id="reset-email-help" className={styles.hint}>Use the email address linked to your LearningMap account.</p>
      </div>
      <AuthSubmit label="Send reset link" pendingLabel="Requesting your link…" />
    </form>}
    <p className={styles.afterForm}><Link href="/login"><span aria-hidden="true">← </span>Back to sign in</Link></p>
  </AuthLayout>;
}
