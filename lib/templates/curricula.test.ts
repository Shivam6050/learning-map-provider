vi.mock("server-only",()=>({}));
import {it,expect,vi} from "vitest";
import {templateBlueprints} from "./blueprints";
it("covers every field and level with distinct curricula and resource candidates",()=>{
 const plans=templateBlueprints();expect(plans).toHaveLength(18);
 for(const plan of plans){expect(plan.stages.length).toBeGreaterThanOrEqual(4);for(const stage of plan.stages){expect(stage.resources.length,plan.field_slug+" / "+stage.title).toBeGreaterThan(0);expect(stage.practice_check.length).toBeGreaterThan(50);}}
 for(const field of new Set(plans.map(p=>p.field_slug))){const titles=plans.filter(p=>p.field_slug===field).map(p=>p.stages.map(s=>s.title).join("|"));expect(new Set(titles).size).toBe(3);}
});
