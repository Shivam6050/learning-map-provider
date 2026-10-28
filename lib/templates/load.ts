import { after } from "next/server";
import { logError } from "@/lib/monitoring/log-error";
import { createServiceClient } from "@/lib/supabase/service";
import { validTemplate } from "./validate";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";

function reportFallback(phase: string) {
  const error = new Error(`Saved template unavailable during ${phase}`);
  // Keep the monitoring webhook off the generation critical path. Next retains this
  // callback after the action response, including its selection-page redirect.
  try { after(() => logError("templates/load", error)); }
  catch { console.error("[templates/load]", error.message); }
}

export async function loadRoadmapTemplate(field: string, level: string, currency: string) {
  let phase = "configuration";
  try {
    // Both reads share one budget; the resource read must not start a fresh timeout.
    const signal = AbortSignal.timeout(3000);
    const client = createServiceClient();
    phase = "template_read";
    const { data, error } = await client.from("roadmap_templates")
      .select("field_slug,skill_level,version,valid_until,stages")
      .eq("field_slug", field).eq("skill_level", level).eq("status", "published")
      .gt("valid_until", new Date().toISOString()).order("version", { ascending: false }).limit(1)
      .abortSignal(signal).maybeSingle();
    signal.throwIfAborted();
    if (error) throw new Error("Template lookup failed");
    if (!validTemplate(data, field, level)) {
      console.warn("[templates] Missing, invalid or expired curriculum; using generation fallback");
      return null;
    }
    const ids = [...new Set(data.stages.flatMap(stage => stage.resource_ids))];
    phase = "resource_read";
    const { data: rows, error: resourcesError } = await client.from("resources")
      .select("id,title,url,platform,resource_type,price,currency,signals,trust_status,rating,link_status")
      .in("id", ids).abortSignal(signal);
    signal.throwIfAborted();
    if (resourcesError || !rows) throw new Error("Resource lookup failed");
    phase = "resource_validation";
    const resources = new Map<string, DiscoveredResource>(rows
      .filter((resource: DiscoveredResource) => resource.price === 0 && !resource.signals?.price_unverified && resource.trust_status !== "rejected" && resource.link_status !== "broken" && isSafeHttpUrl(resource.url))
      .map((resource: DiscoveredResource) => [resource.id, { ...resource, currency }]));
    const stages = data.stages.map(stage => ({ ...stage, candidates: stage.resource_ids.flatMap(id => {
      const resource = resources.get(id); return resource ? [resource] : [];
    }) }));
    if (stages.some(stage => !stage.candidates.length) || !validTemplate(data, field, level)) return null;
    return { version: data.version, stages };
  } catch {
    reportFallback(phase);
    return null; // Preserve the existing normal generation pipeline on any cache failure.
  }
}
