import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 font-serif text-lg font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-sm shadow-md">
                🗺️
              </span>
              <span>Learning<span className="gradient-text">Map</span></span>
            </Link>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
              Personalized, AI-curated learning paths tailored to your schedule, skill level, and budget. Built with Next.js 16 and Google Gemini 2.5.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Navigation
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/onboarding" className="transition hover:text-white">
                  Generate Roadmap
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition hover:text-white">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="transition hover:text-white">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Legal & Safety
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/terms" className="transition hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>&copy; 2026 Learning Map. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Google Gemini AI ⚡</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
