import {curriculumUnit, type CurriculumRef} from "./authored-curriculum";

/** Upgrade legacy boilerplate in the view; never rewrite saved notes or curriculum versions. */
export function stagePracticeBrief(title: string, saved?: string, reference?: CurriculumRef): string | null {
  const existing = saved?.trim();
  const isLegacyPlaceholder = existing?.startsWith("Create a small demonstrable example of "+title+".");
  if (existing && !isLegacyPlaceholder) return existing;
  const unit = curriculumUnit(title, reference);
  if (!unit) return existing || null;
  return unit.project + " Include reproducible checks, a failure or boundary case, and notes explaining your decisions.";
}
