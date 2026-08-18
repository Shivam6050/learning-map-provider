import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { confirmSelectedPath } from "@/app/onboarding/actions";

export default async function OnboardingSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string }>;
}) {
  const { set } = await searchParams;
  const supabase = await createClient();

  // RLS (pending_path_sets_owner_all) ensures this returns null both
  // when the row doesn't exist and when it belongs to someone else.
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
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Session Expired</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your generated path options session has expired or was not found. Please try generating a path again.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Return to Onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-semibold tracking-wide uppercase text-indigo-600">
          {pathSet.field_name}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
          Choose Your Tailored Learning Path
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          We generated 3 tailored path options based on your <span className="font-semibold text-slate-800">{pathSet.skill_level}</span> level,{" "}
          <span className="font-semibold text-slate-800">{pathSet.weekly_hours} hrs/week</span> commitment, and budget limit of{" "}
          <span className="font-semibold text-slate-800">{pathSet.budget_total} {pathSet.currency}</span>.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        {pathSet.options.map((option, idx) => {
          const isBestValue = idx === 0 && pathSet.budget_total > 0;

          return (
            <div
              key={option.id}
              className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-lg ${
                isBestValue
                  ? "border-indigo-500 ring-2 ring-indigo-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {isBestValue && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow">
                  Recommended
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-slate-900">{option.name}</h2>
                </div>

                <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {option.tagline}
                </p>

                <div className="mt-5 flex items-baseline justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Est. Cost</p>
                    <p className="text-xl font-extrabold text-emerald-600">
                      {option.total_cost > 0
                        ? `${option.total_cost} ${pathSet.currency}`
                        : "Free ($0)"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Budget</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {pathSet.budget_total} {pathSet.currency}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Included Curriculum & Courses:
                  </p>
                  <ul className="space-y-3">
                    {option.stages.map((stage: any) => {
                      return (
                        <li key={stage.order_index} className="text-xs">
                          <p className="font-semibold text-slate-800">
                            {stage.order_index + 1}. {stage.title}
                          </p>
                          <div className="mt-1 space-y-1">
                            {stage.stage_resources.map((sr: any, rIdx: number) => (
                              <div
                                key={rIdx}
                                className="flex items-center justify-between text-[11px] text-slate-600"
                              >
                                <span className="truncate max-w-[170px] font-medium text-indigo-600">
                                  {sr.resources.title}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold ${
                                    sr.resources.price > 0
                                      ? "text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {sr.resources.price > 0
                                    ? `${sr.resources.price} ${pathSet.currency}`
                                    : "Free"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <form action={confirmSelectedPath} className="mt-8">
                <input type="hidden" name="setId" value={pathSet.setId} />
                <input type="hidden" name="optionId" value={option.id} />
                <button
                  type="submit"
                  className={`w-full rounded-xl py-3 px-4 text-xs font-bold transition shadow-sm ${
                    isBestValue
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  Confirm & Start This Path →
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <Link href="/onboarding" className="text-xs font-medium text-slate-500 hover:text-slate-700 underline">
          ← Re-enter preferences or change budget
        </Link>
      </div>
    </div>
  );
}
