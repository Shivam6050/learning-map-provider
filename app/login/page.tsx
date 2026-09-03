import Link from "next/link";
import { login } from "@/app/auth/actions";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 bg-slate-950 text-slate-100 bg-grid-pattern">
      <div className="glow-orb-indigo top-10 left-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md glass-card rounded-2xl p-8 border-slate-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl border border-indigo-500/20">
            🔐
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-white sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Log in to continue your custom learning journey.
          </p>
        </div>

        {params.message && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300 backdrop-blur-md" aria-live="polite">
            ✅ {params.message}
          </div>
        )}
        {params.error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300 backdrop-blur-md" role="alert">
            ⚠️ {params.error}
          </div>
        )}

        <div className="mt-6">
          <GoogleSignInButton />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          or continue with email
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <form action={login} className="space-y-5">
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

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-medium text-indigo-400 transition hover:text-indigo-300 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          >
            Log in to My Account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-indigo-400 transition hover:text-indigo-300 hover:underline">
            Create an account free
          </Link>
        </p>
      </div>
    </div>
  );
}
