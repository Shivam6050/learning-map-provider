import {expect,it} from "vitest";
import {resumeStage} from "./resume";
import {parseLastResource,resourceStorageKey} from "./last-resource";
it("resumes the latest active stage across paths",()=>{const stages=[{id:"older",status:"in_progress",updatedAt:"2026-10-01"},{id:"latest",status:"in_progress",updatedAt:"2026-10-02"},{id:"new",status:"not_started"}];expect(resumeStage(stages)?.id).toBe("latest");});
it("handles legacy progress and invalid timestamps without losing a stage",()=>{expect(resumeStage([{id:"one",status:"in_progress",updatedAt:"invalid"},{id:"two",status:"in_progress"}])?.id).toBe("one");});
it("falls back to the first unfinished stage and handles finished paths",()=>{expect(resumeStage([{status:"completed"},{status:"not_started",id:"next"}])?.id).toBe("next");expect(resumeStage([{status:"completed"}])).toBeUndefined();expect(resumeStage([])).toBeUndefined();});
it("ignores malformed resource history and stores identifiers only",()=>{expect(parseLastResource("bad json")).toBeNull();expect(parseLastResource('{"stageId":123}')).toBeNull();expect(parseLastResource('{"stageId":"s","resourceId":"r","url":"javascript:alert(1)"}')).toEqual({stageId:"s",resourceId:"r"});});
it("separates resource history by account and roadmap",()=>{expect(resourceStorageKey("alice","path")).not.toBe(resourceStorageKey("bob","path"));expect(resourceStorageKey("alice","path")).not.toBe(resourceStorageKey("alice","other"));});
