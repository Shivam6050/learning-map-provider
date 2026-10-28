/** Default is read-only validation; the CLI's --publish writes a new version. */
import { templateBlueprints } from "@/lib/templates/blueprints";
import { inspectUrl } from "@/lib/link-check/check-url";
import { createServiceClient } from "@/lib/supabase/service";
import { getVideoStats } from "@/lib/youtube/client";
import { validTemplate } from "./validate";

type Phase = "blueprints" | "verification_deadline" | "resource_verification" | "resource_coverage" | "configuration" | "schema_check" | "resource_write" | "resource_read" | "template_validation" | "template_write" | "publication_confirmation";
export class TemplatePublicationError extends Error {
  constructor(public readonly reason: Phase, public readonly publication: "not_started" | "unknown", public readonly version?: number) {
    super(`Template refresh failed during ${reason}; publication ${publication}`);
    this.name = "TemplatePublicationError";
  }
}

export async function publishRoadmapTemplates(publish = false, options: { verificationDeadline?: number } = {}) {
  let phase: Phase = "blueprints";
  let publicationAttempted = false;
  let version: number | undefined;
  try {
    const blueprints = templateBlueprints();
    if (!blueprints.length) throw new Error("No templates");
    const seeds = [...new Map(blueprints.flatMap(t => t.stages.flatMap(s => s.resources)).map(r => [r.url, r])).values()];
    const alive = new Set<string>();
    const deadline = options.verificationDeadline ?? Infinity;
    function checkDeadline() {
      if (Number.isNaN(deadline) || Date.now() >= deadline) {
        phase = "verification_deadline";
        throw new Error("Verification budget exhausted");
      }
    }
    for (let i = 0; i < seeds.length; i += 6) {
      checkDeadline();
      phase = "resource_verification";
      await Promise.all(seeds.slice(i, i + 6).map(async seed => {
        try {
          if (seed.platform === "youtube") {
            const id = new URL(seed.url).searchParams.get("v");
            if (id && (await getVideoStats([id])).some(video => video.videoId === id)) alive.add(seed.url);
          } else if ((await inspectUrl(seed.url)).status === "ok") alive.add(seed.url);
        } catch { /* Unverifiable resources are omitted, never silently approved. */ }
      }));
    }
    checkDeadline();
    phase = "resource_coverage";
    const ready = blueprints.map(t => ({ ...t, stages: t.stages.map(s => ({ ...s, resources: s.resources.filter(r => alive.has(r.url)) })) }));
    if (ready.some(t => !t.stages.length || t.stages.some(s => !s.resources.length))) throw new Error("Incomplete coverage");
    if (!publish) {
      console.info("[templates/validate]", { templates: ready.length, verifiedResources: alive.size });
      return { status: "validated" as const, templates: ready.length, verifiedResources: alive.size };
    }
    phase = "configuration";
    const client = createServiceClient();
    phase = "schema_check";
    const { error: schemaError } = await client.from("roadmap_templates").select("version").limit(1).abortSignal(AbortSignal.timeout(3000));
    if (schemaError) throw new Error("Schema unavailable");
    const verified = seeds.filter(r => alive.has(r.url));
    phase = "resource_write";
    const { error: insertError } = await client.from("resources").upsert(verified.map(r => ({ title: r.title, url: r.url, platform: r.platform, resource_type: r.resource_type, price: 0, currency: "USD", trust_status: "allowlisted" })), { onConflict: "url", ignoreDuplicates: true }).abortSignal(AbortSignal.timeout(3000));
    if (insertError) throw new Error("Resource storage unavailable");
    phase = "resource_read";
    const { data: rows, error: readError } = await client.from("resources").select("id,url,price,signals,link_status,trust_status").in("url", verified.map(r => r.url)).abortSignal(AbortSignal.timeout(3000));
    if (readError || !rows) throw new Error("Resource lookup unavailable");
    // Null/empty prices are unknown, not free. Retain explicit numeric zero only.
    const byUrl = new Map(rows.filter(r => (r.price === 0 || r.price === "0" || r.price === "0.00") && !r.signals?.price_unverified && r.link_status !== "broken" && r.trust_status !== "rejected").map(r => [r.url, r.id]));
    version = Math.floor(Date.now() / 1000);
    const checked = new Date();
    const validUntil = new Date(checked.getTime() + 30 * 86400000).toISOString();
    const records = ready.map(t => ({ field_slug: t.field_slug, skill_level: t.skill_level, version: version!, status: "published", reviewed_at: checked.toISOString(), valid_until: validUntil, stages: t.stages.map(({ resources, ...stage }) => ({ ...stage, resource_ids: resources.flatMap(r => byUrl.has(r.url) ? [byUrl.get(r.url)!] : []) })) }));
    phase = "template_validation";
    if (records.some(t => !validTemplate(t, t.field_slug, t.skill_level))) throw new Error("Invalid template");
    phase = "template_write";
    publicationAttempted = true;
    // One insert publishes the complete version; never delete previous versions on failure.
    const { error } = await client.from("roadmap_templates").insert(records).abortSignal(AbortSignal.timeout(3000));
    if (error) throw new Error("Publication write failed");
    phase = "publication_confirmation";
    const { data: stored, error: verifyError } = await client.from("roadmap_templates").select("field_slug,skill_level,version").eq("version", version).abortSignal(AbortSignal.timeout(3000));
    const expected = new Set(records.map(t => `${t.field_slug}/${t.skill_level}`));
    const actual = new Set((stored ?? []).map(t => `${t.field_slug}/${t.skill_level}`));
    if (verifyError || stored?.length !== records.length || actual.size !== expected.size || stored.some(t => t.version !== version) || [...expected].some(key => !actual.has(key))) throw new Error("Publication could not be confirmed");
    const result = { status: "published" as const, version, templates: records.length, verifiedResources: alive.size, validUntil };
    console.info("[templates/publish]", result);
    return result;
  } catch {
    // Do not include provider/database messages in errors sent to monitoring or the CLI.
    throw new TemplatePublicationError(phase, publicationAttempted ? "unknown" : "not_started", version);
  }
}
