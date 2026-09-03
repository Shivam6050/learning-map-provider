import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 bg-slate-950 text-slate-100 bg-grid-pattern">
      <div className="glow-orb-indigo top-10 left-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md glass-card rounded-2xl p-8 border-slate-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl border border-indigo-500/20">
            🔑
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-white sm:text-3xl">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            We&apos;ll email you a secure link to set a new password.
          </p>
        </div>

        {params.sent && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300 backdrop-blur-md" aria-live="polite">
            ✅ If an account exists for that email, a reset link is on its way.
          </div>
        )}
        {params.error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300 backdrop-blur-md" role="alert">
            ⚠️ {params.error}
          </div>
        )}

        <form action={requestPasswordReset} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          >
            Send Reset Link
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          <Link href="/login" className="font-semibold text-indigo-400 transition hover:text-indigo-300 hover:underline">
            ← Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
