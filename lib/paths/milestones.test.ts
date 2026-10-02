import {expect,it} from "vitest";
import {projectMilestones} from "./milestones";
it("gives stable deliverables with a stage-specific outcome and check",()=>{const m=projectMilestones("HTTP and REST",null);expect(m.map(item=>item.id)).toEqual(["build","verify","explain"]);expect(m[0].criterion).toContain("HTTP and REST");expect(m[1].criterion).toContain("status codes");});
it("provides useful checks for unfamiliar subjects",()=>{expect(projectMilestones("Watercolour",null)).toHaveLength(3);});
