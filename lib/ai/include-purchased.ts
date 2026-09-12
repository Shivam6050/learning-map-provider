import type { PathOption } from "./build-options";

/** Only resource IDs offered by the server for this option can be included. */
export function includePurchased(option: PathOption, ids: string[]): PathOption {
  const selected = [...new Set(ids)];
  const allowed = option.paid_alternatives ?? [];
  if (selected.some(id => !allowed.some(course => course.resource_id === id))) throw new Error("A selected course is no longer available in these recommendations. Generate a new path.");
  return { ...option, stages: option.stages.map(stage => {
    const additions = allowed.filter(course => selected.includes(course.resource_id) && course.stage_indices.includes(stage.order_index) && !stage.stage_resources.some(sr => sr.resource_id === course.resource_id));
    return { ...stage, stage_resources: [...stage.stage_resources, ...additions.map((course, i) => ({ resource_id: course.resource_id, resources: course.resources, is_primary: false, order_index: stage.stage_resources.length + i }))] };
  }) };
}
