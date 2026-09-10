import { generatePath } from "@/app/onboarding/actions";
import { FieldAndQuizPicker } from "@/components/FieldAndQuizPicker";
import { CommitmentAndBudgetPicker } from "@/components/CommitmentAndBudgetPicker";
import { SubmitButton } from "@/components/SubmitButton";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; field?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16 bg-slate-950 text-slate-100 bg-grid-pattern">
      <div className="glow-orb-indigo top-10 left-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-10 border-slate-800 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-3xl border border-indigo-500/20">
            ↗
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl">
            Let&apos;s map your path
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Choose a direction, find your starting point, and make room for learning in your week.
          </p>
        </div>

        {params.error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 backdrop-blur-md" role="alert">
            ⚠️ {params.error}
          </div>
        )}

        <form action={generatePath} className="mt-8 space-y-6">
          <FieldAndQuizPicker initialField={params.field} />
          <CommitmentAndBudgetPicker />

          <SubmitButton />
          
          <p className="text-center text-xs text-slate-400">
            We check resources while building your options. This can take a minute.
          </p>
        </form>
      </div>
    </div>
  );
}
