import { PathSelectionForm } from "@/components/PathSelectionForm";
import { courseLink } from "@/lib/affiliates/links";
import { Money, RememberCurrency } from "@/components/CurrencyProvider";
import { providerName } from "@/lib/web-discovery/providers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { confirmSelectedPath } from "@/app/onboarding/actions";
import { ensureHttpUrl } from "@/lib/link-check/url-safety";
import { getFieldBySlug } from "@/lib/fields/catalog";
import { ConfirmPathButton } from "@/components/ConfirmPathButton";

export default async function OnboardingSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string; optionId?: string; autoConfirm?: string; field?: string; quizScore?: string; quizImplied?: string; selfReported?: string; finalLevel?: string }>;
}) {
  const { set, optionId, autoConfirm, field: fieldParam, quizScore, selfReported, finalLevel } = await searchParams;
  const service = createServiceClient();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (autoConfirm === "1" && set && optionId && user) {
    const formData = new FormData();
    formData.set("setId", set);
    formData.set("optionId", optionId);
    await confirmSelectedPath(formData);
  }

  const { data: row } = set
    ? await service
        .from("pending_path_sets")
        .select("id, field_id, skill_level, weekly_hours, budget_total, currency, options, fields(name, slug)")
        .eq("id", set)
        .maybeSingle()
    : { data: null };

  let resolvedFieldName = Array.isArray(row?.fields) ? row?.fields[0]?.name : (row?.fields as any)?.name;
  let resolvedFieldSlug = Array.isArray(row?.fields) ? row?.fields[0]?.slug : (row?.fields as any)?.slug;

  if (!resolvedFieldName && row?.field_id) {
    const { data: fRow } = await service.from("fields").select("name, slug").eq("id", row.field_id).maybeSingle();
    if (fRow?.name) {
      resolvedFieldName = fRow.name;
      resolvedFieldSlug = fRow.slug;
    }
  }

  if (!resolvedFieldName && (resolvedFieldSlug || fieldParam)) {
    const catalogMatch = getFieldBySlug(resolvedFieldSlug || fieldParam || "");
    if (catalogMatch) {
      resolvedFieldName = catalogMatch.name;
    }
  }

  const pathSet = row
    ? {
        setId: row.id,
        field_name: resolvedFieldName || "Selected Learning Stream",
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
      <RememberCurrency value={pathSet.currency} />
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
            <span className="font-bold text-emerald-400"><Money amount={pathSet.budget_total} currency={pathSet.currency} /></span>.
          </p>
          {quizScore && (
            <p className="mt-2 text-xs text-slate-400">
              Starting-level estimate: quiz score ({quizScore}/5) →{" "}
              <strong className="text-indigo-300">{finalLevel}</strong>.
            </p>
          )}
        </div>

        <p className="mt-6 rounded-xl border border-slate-700 p-4 text-sm text-slate-300">Course costs are planning estimates. Provider checkout prices can vary by region, account, tax and promotion. Courses without a verifiable price are excluded; subscriptions show a monthly rate and the estimated number of months included in the total. Cancel renewal when you finish; regional discounts are not assumed.</p>
        {pathSet.options.some(option => option.stages.some((stage: any) => stage.stage_resources.some((sr: any) => courseLink(sr.resources?.url || "", sr.resources?.affiliate === true).affiliate))) && <p className="mt-3 text-sm text-slate-400">Some course links are affiliate links. Learning Map may earn a commission if you buy through them. Selection is based on relevance and your budget.</p>}
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {pathSet.options.map((option, idx) => {
            const paidUnavailable = idx < 2 && pathSet.budget_total > 0 && option.total_cost === 0;
            const isBestValue = idx === 0 && pathSet.budget_total > 0 && option.target_met === true;

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


                  {option.subscriptions?.map((plan: any) => <p key={plan.provider} className="mt-4 rounded-xl border border-slate-700 p-3 text-xs text-slate-300">Scrimba Pro: {plan.months} month(s) × <Money amount={plan.monthly_price} currency={pathSet.currency} />. Included once across selected courses, starting at the first paid stage. Renews monthly until cancelled.</p>)}
                  <div className="mt-5 flex items-baseline justify-between rounded-2xl bg-slate-900/80 p-4 border border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Est. Cost</p>
                      <p className="text-lg font-extrabold text-emerald-400">
                        {paidUnavailable ? "Paid courses unavailable" : <Money amount={option.total_cost} currency={pathSet.currency} freeLabel />}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tier Limit</p>
                      <p className="text-sm font-semibold text-slate-300">
                        <Money amount={option.budget_cap ?? pathSet.budget_total} currency={pathSet.currency} />
                      </p>
                    </div>
                  </div>

                  {option.availability_note && <p role="status" className="mt-4 rounded-xl border border-amber-600/30 p-3 text-xs text-amber-300">{option.availability_note}</p>}
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
                              const outgoing = courseLink(sr.resources?.url || "", sr.resources?.affiliate === true);
                              const safeUrl = outgoing.href;
                              const p = (sr.resources?.platform || "").toLowerCase();
                              const t = (sr.resources?.resource_type || "").toLowerCase();
                              let icon = "📰";
                              let label = "Guide";
                              let action = "Read Guide";
                              if (p === "youtube" || t === "video") {
                                icon = "🎥"; label = "YouTube"; action = "Watch Video";
                              } else if (p === "udemy" || p === "coursera" || t === "course") {
                                icon = "🎓"; label = p === "udemy" ? "Udemy" : p === "coursera" ? "Coursera" : "Course"; action = "Open Course";
                              } else if (p === "docs" || p === "mslearn" || t === "docs") {
                                icon = "📄"; label = "Docs"; action = "Read Docs";
                              }

                              return (
                                <div
                                  key={rIdx}
                                  className="flex flex-col gap-1.5 bg-slate-950/90 rounded-xl p-2.5 border border-slate-800/80 hover:border-indigo-500/40 transition"
                                >
                                  <div className="flex items-center justify-between gap-2 text-[10px]">
                                    <span className="font-bold tracking-wider text-slate-400 flex items-center gap-1 uppercase">
                                      <span>{icon}</span>
                                      <span>{t === "course" ? p === "udemy" ? "Udemy" : providerName(sr.resources?.url ?? "") : label}</span>
                                    </span>
                                    <span className="font-extrabold text-emerald-400">
                                      <Money amount={sr.resources?.price ?? 0} currency={sr.resources?.currency ?? pathSet.currency} freeLabel />{sr.resources?.billing_interval === "month" ? " / month" : ""}
                                    </span>
                                  </div>
                                  {safeUrl ? (
                                    <a
                                      href={safeUrl}
                                      target="_blank"
                                      rel={outgoing.affiliate ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                                      className="font-bold text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center justify-between gap-2 group"
                                    >
                                      <span className="truncate">{sr.resources?.title || "Resource Link"}</span>
                                      <span className="shrink-0 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white transition">
                                        {action} ↗
                                      </span>
                                    </a>
                                  ) : (
                                    <span className="font-medium text-xs text-slate-300 truncate">
                                      {sr.resources?.title || "Resource"}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <PathSelectionForm setId={pathSet.setId} optionId={option.id} alternatives={option.paid_alternatives ?? []} unavailable={paidUnavailable} signedIn={!!user} currency={pathSet.currency} />
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
