import { generatePath } from "@/app/onboarding/actions";
import { FieldAndQuizPicker } from "@/components/FieldAndQuizPicker";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16 bg-slate-950 text-slate-100 bg-grid-pattern">
      <div className="glow-orb-indigo top-10 left-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-10 border-slate-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-3xl border border-indigo-500/20">
            ✨
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl">
            Let&apos;s map your path
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Configure your goal, time commitment, and budget. Our Gemini AI will build a personalized milestone roadmap for you.
          </p>
        </div>

        {params.error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 backdrop-blur-md" role="alert">
            ⚠️ {params.error}
          </div>
        )}

        <form action={generatePath} className="mt-8 space-y-6">
          <FieldAndQuizPicker />

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              2. Commitment & Budget
            </h3>

            <div>
              <label htmlFor="skillLevel" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Self-Reported Skill Level
              </label>
              <select
                id="skillLevel"
                name="skillLevel"
                required
                defaultValue="beginner"
                className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="beginner">Beginner (Starting from scratch)</option>
                <option value="intermediate">Intermediate (Know fundamentals)</option>
                <option value="advanced">Advanced (Deepening expertise)</option>
              </select>
            </div>

            <div>
              <label htmlFor="weeklyHours" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Hours Per Week You Can Commit (1 - 80)
              </label>
              <input
                id="weeklyHours"
                name="weeklyHours"
                type="number"
                min={1}
                max={80}
                defaultValue={5}
                required
                className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label htmlFor="budgetTotal" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Total Budget Limit (0 = Free Only)
                </label>
                <input
                  id="budgetTotal"
                  name="budgetTotal"
                  type="number"
                  min={0}
                  defaultValue={50}
                  placeholder="e.g. 50"
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue="USD"
                  className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full rounded-xl px-6 py-4 text-base font-semibold shadow-xl"
          >
            <span>✨</span> Generate My Personal Roadmap
          </button>
          
          <p className="text-center text-xs text-slate-400">
            🤖 Calls Gemini 2.5 AI for skeleton creation & real resource matching (takes ~5-10s).
          </p>
        </form>
      </div>
    </div>
  );
}
