import { experiencedCurriculum } from "./curricula";
import { FIELD_FALLBACK_SKELETONS } from "@/lib/ai/skeleton";
import { BASE_SEED_RESOURCES, matchTopicHint } from "@/lib/ai/seed-resources";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import type { SkillLevel } from "@/lib/onboarding/skill-quiz";
/** Authored curricula; publication validates resource availability before activation. */
export function templateBlueprints() {
 return FIELD_CATALOG.flatMap(field => (["beginner","intermediate","advanced"] as SkillLevel[]).map(level => {
  const base=FIELD_FALLBACK_SKELETONS[field.slug];
  if (!base) throw new Error("Missing curriculum for " + field.slug);
  const curriculum=level === "beginner" ? base.map(stage=>({...stage,practice_check:"Create a small demonstrable example of " + stage.title + ". Include a successful case, a failing case, and instructions to reproduce both. Explain how it connects to the previous stage."})) : experiencedCurriculum(field.slug,level);
  const stages=curriculum.map((stage,index)=>({
   ...stage,order_index:index,
   resources:BASE_SEED_RESOURCES.filter(r=>r.price===0 && (!r.field_slug || r.field_slug===field.slug) && r.topic_hints.some(h=>stage.search_topics.some(t=>matchTopicHint(t,h)))).slice(0,5),
  }));
  return {field_slug:field.slug,skill_level:level,stages};
 }));
}
