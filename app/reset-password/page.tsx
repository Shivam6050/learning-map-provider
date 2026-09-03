import { updatePasswordAfterReset } from "@/app/auth/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 bg-slate-950 text-slate-100 bg-grid-pattern">
      <div className="glow-orb-indigo top-10 left-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md glass-card rounded-2xl p-8 border-slate-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl border border-indigo-500/20">
            🔒
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-white sm:text-3xl">
            Set a new password
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Choose a strong password for your account.
          </p>
        </div>

        {params.error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300 backdrop-blur-md" role="alert">
            ⚠️ {params.error}
          </div>
        )}

        <form action={updatePasswordAfterReset} className="mt-6 space-y-5">
          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
          </div>

          <button
            type="submit"
            className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          >
            Update Password & Log In
          </button>
        </form>
      </div>
    </div>
  );
}
