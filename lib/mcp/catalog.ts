import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { CURATED_LEARNING_RESOURCES } from "@/lib/web-discovery/curated-resources";
import { templateBlueprints } from "@/lib/templates/blueprints";

export const CATALOG_NOTICE = "Authored curriculum preview, not a saved or personalized roadmap. Resource availability and free access are not checked live. Paid certificates or upgrades may cost extra; verify on the provider website. No live regional price quotes are provided.";
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const publicResources = CURATED_LEARNING_RESOURCES.filter(resource => resource.price === 0).map(resource => ({
  title: resource.title, url: resource.url, type: resource.resource_type,
  topics: resource.topic_hints, access: "listed-as-free", priceVerifiedLive: false,
}));
export function publicCatalog() {
  return { version: 1, notice: CATALOG_NOTICE, fields: FIELD_CATALOG.map(({slug,name}) => ({slug,name})), levels: LEVELS, resources: publicResources };
}
export function publicRoadmap(field: string, level: string) {
  const template = templateBlueprints().find(item => item.field_slug === field && item.skill_level === level);
  if (!template) return null;
  return { field, level, notice: CATALOG_NOTICE, estimatedHours: template.stages.reduce((sum,stage) => sum + stage.estimated_hours,0), stages: template.stages.map(stage => ({
    order: stage.order_index + 1, title: stage.title, description: stage.description,
    estimatedHours: stage.estimated_hours, topics: stage.search_topics, project: stage.practice_check,
    resources: stage.resources.map(resource => ({title: resource.title, url: resource.url, type: resource.resource_type, access: "listed-as-free", priceVerifiedLive: false})),
  })) };
}
