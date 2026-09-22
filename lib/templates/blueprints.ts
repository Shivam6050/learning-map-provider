import { FIELD_FALLBACK_SKELETONS } from "@/lib/ai/skeleton";
import { BASE_SEED_RESOURCES, matchTopicHint } from "@/lib/ai/seed-resources";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import type { SkillLevel } from "@/lib/onboarding/skill-quiz";
/** Reviewed source catalog. Publication verifies availability before activating a version. */
export function templateBlueprints() {
 return FIELD_CATALOG.flatMap(field => (["beginner","intermediate","advanced"] as SkillLevel[]).map(level => {
  const base=FIELD_FALLBACK_SKELETONS[field.slug];
  if (!base) throw new Error("Missing curriculum for " + field.slug);
  const start=level==="advanced" ? Math.max(1,base.length-2) : level==="intermediate" ? 1 : 0;
  const stages=base.slice(start).map((stage,index)=>({
   ...stage,order_index:index,
   practice_check:"Build a working example applying " + stage.title + ". Explain your design decisions, test an edge case, and document what you would improve.",
   resources:BASE_SEED_RESOURCES.filter(r=>r.price===0 && (!r.field_slug || r.field_slug===field.slug) && r.topic_hints.some(h=>stage.search_topics.some(t=>matchTopicHint(t,h)))).slice(0,5),
  }));
  return {field_slug:field.slug,skill_level:level,stages};
 }));
}
