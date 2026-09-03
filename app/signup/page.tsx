import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { AVATAR_OPTIONS } from "@/lib/profile/avatars";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12 bg-slate-950 text-slate-100 bg-grid-pattern">
      <div className="glow-orb-purple top-10 left-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md glass-card rounded-2xl p-8 border-slate-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl border border-purple-500/20">
            ✨
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-white sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Tell us what you want to learn, we&apos;ll map your path.
          </p>
        </div>

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
          or register with email
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <form action={signup} className="space-y-5">
          <div>
            <label htmlFor="displayName" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Full Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder="e.g. Alex Dev"
              className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Pick Your Companion Avatar
            </span>
            <p className="mt-1 text-xs text-slate-400">
              Your avatar walks your learning roadmap with you as you complete stages.
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2.5">
              {AVATAR_OPTIONS.map((avatar, i) => (
                <label key={avatar.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="avatarId"
                    value={avatar.id}
                    defaultChecked={i === 0}
                    required
                    className="peer sr-only"
                  />
                  <span className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 text-2xl transition peer-checked:border-indigo-500 peer-checked:bg-indigo-500/10 peer-checked:ring-2 peer-checked:ring-indigo-500/30 hover:border-slate-700">
                    {avatar.emoji}
                    <span className="text-[10px] font-semibold text-slate-400">{avatar.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

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
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
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

          <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" name="acceptTerms" required className="mt-0.5 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500" />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link> and{" "}
              <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
            </span>
          </label>

          <button
            type="submit"
            className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          >
            Create My Free Account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-400 transition hover:text-indigo-300 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
