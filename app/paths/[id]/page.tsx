import { currentQuote } from "@/lib/pricing/current-quote";
import { getLearningUser } from "@/lib/auth/learning-user";
import { AddToCalendar } from "@/components/AddToCalendar";
import styles from "@/components/Roadmap.module.css";
import { pathCost } from "@/lib/pricing/path-cost";
import { courseLink } from "@/lib/affiliates/links";
import { Money, RememberCurrency } from "@/components/CurrencyProvider";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { PathBoard } from "@/components/PathBoard";
import { FilteredStageList } from "@/components/FilteredStageList";

import { convertPrice } from "@/lib/currency/convert";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { computeStageTimeline } from "@/lib/paths/timeline";
import { getFieldBySlug } from "@/lib/fields/catalog";

export default async function PathPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await getLearningUser(supabase);

  const service = createServiceClient();
  const { data: path, error: pathError } = await supabase
    .from("learning_paths")
    .select("id, field_id, skill_level, weekly_hours, budget_total, currency, fields(name, slug)")
    .eq("id", id)
    .maybeSingle();

  if (pathError || !path) notFound();

  let { data: stages, error: stagesError } = await supabase
    .from("stages")
    .select(
      `
      id, order_index, title, description, estimated_hours,
      stage_resources (
        is_primary,
        order_index,
        resources ( id, title, url, platform, resource_type, price, currency, rating, link_status, signals )
      ),
      stage_progress ( status, completed_at, practice_check )
    `
    )
    .eq("path_id", id)
    .order("order_index");

  if (stagesError && stagesError.message?.includes("link_status")) {
    const fallback = await supabase
      .from("stages")
      .select(
        `
        id, order_index, title, description, estimated_hours,
        stage_resources (
          is_primary,
          order_index,
          resources ( id, title, url, platform, resource_type, price, currency, rating, signals )
        ),
        stage_progress ( status, completed_at, practice_check )
      `
      )
      .eq("path_id", id)
      .order("order_index");
    stages = fallback.data;
    stagesError = fallback.error;
  }

  if (stagesError) {
    throw new Error(`Failed to load path stages: ${stagesError.message || "Unknown error"}`);
  }

  let fieldName = Array.isArray(path.fields) ? path.fields[0]?.name : (path.fields as any)?.name;
  let fieldSlug = Array.isArray(path.fields) ? path.fields[0]?.slug : (path.fields as any)?.slug;

  if (!fieldName && path.field_id) {
    const { data: fRow } = await service.from("fields").select("name, slug").eq("id", path.field_id).maybeSingle();
    if (fRow?.name) {
      fieldName = fRow.name;
      fieldSlug = fRow.slug;
    }
  }

  if (!fieldName && fieldSlug) {
    const catalogMatch = getFieldBySlug(fieldSlug);
    if (catalogMatch) fieldName = catalogMatch.name;
  }

  const originalResources: DiscoveredResource[] = (stages ?? []).flatMap((stage: any) => (stage.stage_resources ?? []).flatMap((sr: any) => {
    const resource = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
    return resource ? [resource as DiscoveredResource] : [];
  }));
  // Public paid quotes refresh at most every five minutes per market and currency.
  // Never overwrite shared resource rows with a user-specific price.
  const uniqueResources = [...new Map(originalResources.map(resource => [resource.url, resource])).values()];
  const savedResources = await Promise.all(uniqueResources.map(async resource => {
    if (resource.link_status === "broken" || !isSafeHttpUrl(resource.url)) return null;
    if (resource.price > 0 || resource.signals?.price_source === "scrimba_monthly" || resource.signals?.price_source === "scrimba_regional_plan") {
      const quote=await currentQuote(resource.url,path.currency,user?.user_metadata?.country_of_residence || "");
      if (!quote) return {...resource, signals:{...resource.signals,price_unverified:true}};
      return {...resource, price:quote.price, currency:path.currency, signals:{...resource.signals,...quote.signals,price_unverified:false}};
    }
    const price = await convertPrice(resource.price, resource.currency, path.currency);
    return price === null ? null : { ...resource, price, currency: path.currency };
  }));
  const refreshed = savedResources.filter((resource): resource is DiscoveredResource => resource !== null);
  const refreshedByUrl = new Map(refreshed.map(resource => [resource.url, resource]));
  let hiddenResources = 0;
  let totalCost = 0;
  const processedResourceUrls = new Set<string>();
  (stages ?? []).forEach((stage: any) => {
    stage.stage_resources = (stage.stage_resources ?? []).flatMap((sr: any) => {
      const resource = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
      const valid = resource && refreshedByUrl.get(resource.url);
      if (!valid) { hiddenResources++; return []; }
      if (!processedResourceUrls.has(valid.url)) { totalCost += valid.price; processedResourceUrls.add(valid.url); }
      return [{ ...sr, resources: valid }];
    });
  });
  const billing = pathCost((stages ?? []).map((stage: any) => ({ estimated_hours: stage.estimated_hours, resources: stage.stage_resources.map((sr: any) => sr.resources) })), path.weekly_hours);
  totalCost = billing.total;


  const totalStages = stages?.length ?? 0;
  const completedStages = (stages ?? []).filter(
    (s: any) => s.stage_progress?.[0]?.status === "completed"
  ).length;
  const progressPct = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  const { timeline: stageTimeline, totalWeeks } = computeStageTimeline(
    (stages ?? []).map((s: any) => ({ id: s.id, estimated_hours: s.estimated_hours })),
    path.weekly_hours
  );



  const boardStages = (stages ?? []).map((stage: any) => ({
    id: stage.id,
    order_index: stage.order_index,
    title: stage.title,
    status: (stage.stage_progress?.[0]?.status ?? "not_started") as
      | "not_started"
      | "in_progress"
      | "completed",
  }));

  const resourceIds = new Set<string>();
  (stages ?? []).forEach((stage: any) => {
    stage.stage_resources?.forEach((sr: any) => {
      const res = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
      if (res?.id) resourceIds.add(res.id);
    });
  });

  const { data: myRatings } = user && resourceIds.size > 0
    ? await supabase
        .from("resource_ratings")
        .select("resource_id, rating")
        .eq("user_id", user.id)
        .in("resource_id", Array.from(resourceIds))
    : { data: [] };

  const myRatingByResource: Record<string, number> = Object.fromEntries(
    (myRatings ?? []).map((r: any) => [r.resource_id, r.rating])
  );

  const stageTimelineRecord: Record<string, { startWeek: number; endWeek: number }> =
    Object.fromEntries(stageTimeline);

  const nextStage = boardStages.find((stage: { status: string }) => stage.status === "in_progress") ?? boardStages.find((stage: { status: string }) => stage.status !== "completed");
  return <main className={styles.page}>
    <RememberCurrency value={path.currency} />
    <div className={styles.shell}>
      <a href="/dashboard" className={styles.breadcrumb}>← My learning paths <span>/</span> Your roadmap</a>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>Your personal curriculum · {path.skill_level === "advanced" ? "Expert" : path.skill_level}</p><h1 className={styles.title}>{fieldName || "Your learning roadmap"}</h1><p className={styles.intro}>A clear route from knowledge to practice. Work through each stage, build something real, and keep your progress in one place.</p><div className={styles.heroActions}>{nextStage && <a href={"#stage-"+nextStage.id} className={styles.continue}>{completedStages ? "Continue learning" : "Start your first stage"} ↗</a>}<AddToCalendar pathId={path.id} /></div></div>
        <div className={styles.progress}><div className={styles.progressNumber}>{progressPct}<span>%</span></div><p>{completedStages} of {totalStages} stages completed<br/>{nextStage ? "One focused session at a time." : "Every stage completed. Well done."}</p><div className={styles.track} role="progressbar" aria-label="Roadmap completion" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}><div style={{width:progressPct+"%"}}/></div></div>
      </header>
      <dl className={styles.stats}><div className={styles.stat}><dt>Learning pace</dt><dd>{path.weekly_hours} <small>hrs / week</small></dd></div><div className={styles.stat}><dt>Estimated timeline</dt><dd>{totalWeeks} <small>weeks</small></dd></div><div className={styles.stat}><dt>Your budget</dt><dd><Money amount={path.budget_total} currency={path.currency}/></dd></div><div className={styles.stat}><dt>Course cost estimate</dt><dd>{refreshed.some(resource => resource.signals?.price_unverified) ? <>Price confirmation needed</> : <Money amount={totalCost} currency={path.currency} freeLabel/>}</dd></div></dl>
      <div className={styles.layout}><aside className={styles.sidebar}><h2 className={styles.sideHeading}>The route <span>{String(totalStages).padStart(2,"0")} stages</span></h2><PathBoard stages={boardStages}/></aside><section className={styles.content} aria-label="Learning stages"><h2 className={styles.contentHeading}>Your next steps, laid out.</h2><p className={styles.contentIntro}>Learn the concepts. Apply them in the practice task. Mark the stage complete when you’re ready.</p><FilteredStageList stages={stages ?? []} stageTimeline={stageTimelineRecord} path={path} myRatingByResource={myRatingByResource}/></section></div>
      <footer className={styles.disclosures}>{hiddenResources > 0 && <p>{hiddenResources} resources are temporarily hidden while their links or prices cannot be verified. Your progress is preserved.</p>}{refreshed.some(resource => resource.signals?.price_unverified) && <p>Some regional prices could not be verified. Check your country in Settings and confirm those prices with the provider. Unverified amounts are excluded from the estimate. One Scrimba Pro subscription covers multiple eligible courses.</p>}<p>Costs use the last verified course prices and are planning estimates. Availability and prices may change; confirm with the provider before purchasing.</p>{billing.subscriptions.map(plan=><p key={plan.provider}>Scrimba Pro: {plan.periods} {plan.billing_interval === "year" ? "year(s), billed upfront" : "month(s)"} included, counted once across courses. Start access at the first paid stage; cancel renewal when finished.</p>)}{refreshed.some(resource=>courseLink(resource.url,resource.signals?.affiliate===true).affiliate)&&<p>Some course links are affiliate links. LearningMap may earn a commission if you purchase through them.</p>}</footer>
    </div>
  </main>;
}
