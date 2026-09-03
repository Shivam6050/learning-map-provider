import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { confirmSelectedPath } from "@/app/onboarding/actions";
import { ensureHttpUrl } from "@/lib/link-check/url-safety";

export default async function OnboardingSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string; quizScore?: string; quizImplied?: string; selfReported?: string; finalLevel?: string }>;
}) {
  const { set, quizScore, quizImplied, selfReported, finalLevel } = await searchParams;
  const supabase = await createClient();

  const { data: row } = set
    ? await supabase
        .from("pending_path_sets")
        .select("id, skill_level, weekly_hours, budget_total, currency, options, fields(name)")
        .eq("id", set)
        .maybeSingle()
    : { data: null };

  const pathSet = row
    ? {
        setId: row.id,
        field_name: (Array.isArray(row.fields) ? row.fields[0] : row.fields)?.name ?? "Backend Development",
        skill_level: row.skill_level,
        weekly_hours: row.weekly_hours,
        budget_total: row.budget_total,
        currency: row.currency,
        options: row.options as any[],
      }
    : null;

  if (!pathSet) {
    return (
      <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-20 bg-slate-950 text-slate-100 bg-grid-pattern">
        <div className="glass-card max-w-md rounded-3xl p-8 text-center border-slate-800 shadow-2xl">
          <span className="text-4xl">⏱️</span>
          <h1 className="mt-3 font-serif text-2xl font-bold text-white">Session Expired</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your path options session has expired or was not found. Please try generating a path again.
          </p>
          <Link
            href="/onboarding"
            className="btn-primary mt-6 inline-block rounded-xl px-5 py-3 text-xs font-semibold shadow-lg"
          >
            Return to Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 bg-grid-pattern py-12">
      <div className="glow-orb-indigo top-10 left-1/3" />
      <div className="glow-orb-purple bottom-10 right-10" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            {pathSet.field_name}
          </span>
          <h1 className="mt-2 font-serif text-3xl font-extrabold text-white sm:text-4xl">
            Select Your Preferred Roadmap
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            We generated 3 path options based on your <span className="font-bold text-white capitalize">{pathSet.skill_level}</span> level,{" "}
            <span className="font-bold text-white">{pathSet.weekly_hours} hrs/week</span> commitment, and budget of{" "}
            <span className="font-bold text-emerald-400">{pathSet.budget_total} {pathSet.currency}</span>.
          </p>
          {quizScore && (
            <p className="mt-2 text-xs text-slate-400">
              Level assessment: self-reported <strong>{selfReported}</strong> + quiz check score ({quizScore}/5) → calibrated to{" "}
              <strong className="text-indigo-300">{finalLevel}</strong>.
            </p>
          )}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {pathSet.options.map((option, idx) => {
            const isBestValue = idx === 0 && pathSet.budget_total > 0;

            return (
              <div
                key={option.id}
                className={`glass-card relative flex flex-col justify-between rounded-3xl p-6 border-slate-800 shadow-2xl transition-all hover:border-indigo-500/40 ${
                  isBestValue ? "ring-2 ring-indigo-500/40 border-indigo-500/50" : ""
                }`}
              >
                {isBestValue && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg">
                    ★ Recommended Choice
                  </span>
                )}

                <div>
                  <h2 className="font-serif text-xl font-bold text-white mt-1">{option.name}</h2>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed min-h-[36px]">
                    {option.tagline}
                  </p>

                  <div className="mt-5 flex items-baseline justify-between rounded-2xl bg-slate-900/80 p-4 border border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Est. Cost</p>
                      <p className="text-lg font-extrabold text-emerald-400">
                        {option.total_cost > 0
                          ? `${option.total_cost} ${pathSet.currency}`
                          : "Free ($0)"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Budget Limit</p>
                      <p className="text-sm font-semibold text-slate-300">
                        {pathSet.budget_total} {pathSet.currency}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                      Curated Stages ({option.stages.length}):
                    </p>
                    <ul className="space-y-3">
                      {option.stages.map((stage: any) => (
                        <li key={stage.order_index} className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs">
                          <p className="font-semibold text-white">
                            {stage.order_index + 1}. {stage.title}
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {stage.stage_resources.map((sr: any, rIdx: number) => {
                              const safeUrl = ensureHttpUrl(sr.resources?.url || "");
                              return (
                                <div
                                  key={rIdx}
                                  className="flex items-center justify-between gap-2 text-[11px] bg-slate-950/80 rounded-lg p-2 border border-slate-800/80"
                                >
                                  {safeUrl ? (
                                    <a
                                      href={safeUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="truncate max-w-[200px] font-bold text-indigo-400 transition hover:text-indigo-300 hover:underline flex items-center gap-1"
                                    >
                                      <span>🔗 {sr.resources.title}</span>
                                      <span className="text-[10px]">↗</span>
                                    </a>
                                  ) : (
                                    <span className="truncate max-w-[200px] font-medium text-slate-300">
                                      {sr.resources.title}
                                    </span>
                                  )}
                                  <span className="shrink-0 text-[10px] font-bold text-slate-400">
                                    {sr.resources.price > 0
                                      ? `${sr.resources.price} ${pathSet.currency}`
                                      : "Free"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <form action={confirmSelectedPath} className="mt-8">
                  <input type="hidden" name="setId" value={pathSet.setId} />
                  <input type="hidden" name="optionId" value={option.id} />
                  <button
                    type="submit"
                    className={`btn-primary w-full rounded-xl py-3 px-4 text-xs font-bold shadow-lg`}
                  >
                    Confirm & Start This Path →
                  </button>
                </form>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/onboarding" className="text-xs font-semibold text-slate-400 hover:text-white transition underline">
            ← Change preferences or update budget
          </Link>
        </div>
      </div>
    </div>
  );
}
