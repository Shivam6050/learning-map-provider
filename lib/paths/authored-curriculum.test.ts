import {expect,it} from "vitest";
import {curriculumUnits,topicDefinitions,curriculumUnit} from "./authored-curriculum";
import {stageTopics} from "./topics";
import {projectMilestones} from "./milestones";
import {experiencedCurriculum} from "@/lib/templates/curricula";
import {FIELD_FALLBACK_SKELETONS} from "@/lib/ai/skeleton";
import {FIELD_CATALOG} from "@/lib/fields/catalog";
it("covers every canonical stage in all fields and levels",()=>{
 for(const field of FIELD_CATALOG)for(const level of ["beginner","intermediate","advanced"] as const){
  const expected=level==="beginner"?FIELD_FALLBACK_SKELETONS[field.slug]:experiencedCurriculum(field.slug,level);
  for(const stage of expected){const unit=curriculumUnit(stage.title);expect(unit?.field).toBe(field.slug);expect(unit?.level).toBe(level);expect(unit?.topicIds.length).toBeGreaterThan(1);expect(unit?.project.length).toBeGreaterThan(60);}
 }
});
it("uses unique stage titles and valid explicit prerequisites",()=>{
 expect(new Set(curriculumUnits.map(unit=>unit.title)).size).toBe(curriculumUnits.length);
 for(const unit of curriculumUnits)for(const id of [...unit.topicIds,...unit.prerequisiteIds])expect(topicDefinitions[id]).toBeDefined();
});
it("uses fine-grained topics instead of guessing from stage wording",()=>{expect(stageTopics("SQL & Relational Database Modeling",null).map(t=>t.id)).toEqual(["sql.schema","sql.queries","sql.transactions"]);});
it("provides stage-specific briefs with compatible milestone identifiers",()=>{const unit=curriculumUnit("Model reliable data writes")!;const m=projectMilestones(unit.title,null);expect(m.map(item=>item.id)).toEqual(["build","verify","explain"]);expect(m[0].criterion).toBe(unit.project);expect(m[0].criterion).toContain("concurrent");});

it("resolves a saved curriculum independently of its display title",()=>{
 const unit=curriculumUnit("Model reliable data writes")!;
 const ref={id:unit.id,version:unit.version};
 expect(curriculumUnit("Renamed stage",ref)).toBe(unit);
 expect(stageTopics("Renamed stage",null,ref).map(t=>t.id)).toEqual(unit.topicIds);
 expect(projectMilestones("Renamed stage",null,ref)[0].criterion).toBe(unit.project);
 expect(curriculumUnit(unit.title,{id:unit.id,version:999})).toBeUndefined();
 expect(stageTopics(unit.title,null,{id:unit.id,version:999})).toEqual([]);
 expect(projectMilestones(unit.title,null,{id:unit.id,version:999})).toEqual([]);
 expect(new Set(curriculumUnits.map(unit=>unit.id+":"+unit.version)).size).toBe(curriculumUnits.length);
});
