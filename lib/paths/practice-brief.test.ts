import {describe,expect,it} from "vitest";
import {stagePracticeBrief} from "./practice-brief";
import {curriculumUnits} from "./authored-curriculum";

describe("stage practice briefs",()=>{
 const unit=curriculumUnits.find(u=>u.title==="Full-Stack Web Foundations")!;
 it("replaces legacy boilerplate with the exact authored project",()=>{
  const saved="Create a small demonstrable example of "+unit.title+". Include a successful case, a failing case, and instructions to reproduce both.";
  expect(stagePracticeBrief(unit.title,saved)).toContain(unit.project);
  expect(stagePracticeBrief(unit.title,saved)).toContain("failure or boundary case");
 });
 it("preserves a specific saved challenge",()=>{
  expect(stagePracticeBrief(unit.title,"Build a weather dashboard using the supplied API.")).toBe("Build a weather dashboard using the supplied API.");
 });
 it("uses pinned curriculum identity after a title rename",()=>{
  expect(stagePracticeBrief("Renamed stage",undefined,{id:unit.id,version:unit.version})).toContain(unit.project);
 });
 it("does not reinterpret an unavailable pinned version",()=>{
  expect(stagePracticeBrief(unit.title,undefined,{id:unit.id,version:999})).toBeNull();
 });
 it("does not invent a project for an unknown stage",()=>{
  expect(stagePracticeBrief("Unknown specialty")).toBeNull();
  expect(stagePracticeBrief("Unknown specialty","Create a small demonstrable example of Unknown specialty.")).toBe("Create a small demonstrable example of Unknown specialty.");
 });
});
