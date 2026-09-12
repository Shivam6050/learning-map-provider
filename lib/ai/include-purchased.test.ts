import { describe, it, expect } from "vitest";
import { includePurchased } from "./include-purchased";
import type { PathOption, PaidAlternative } from "./build-options";
const course: PaidAlternative = { resource_id: "gfg", title: "MERN", url: "https://www.geeksforgeeks.org/courses/mern", cost: 7999, over_budget: true, stage_indices: [1], resources: {title: "MERN", url: "https://www.geeksforgeeks.org/courses/mern", platform: "article", resource_type: "course", price:7999,currency:"INR"} };
const option: PathOption = {id:"opt-1",name:"Near budget",tagline:"",total_cost:0,total_hours:20,paid_alternatives:[course],stages:[0,1].map(i=>({order_index:i,title:"Stage",description:"",estimated_hours:10,stage_resources:[],practice_check:"Practice"}))};
describe("purchase inclusion",()=>{
  it("adds only confirmed courses to their matching stages",()=>{
    const result=includePurchased(option,["gfg","gfg"]);
    expect(result.stages[0].stage_resources).toHaveLength(0);
    expect(result.stages[1].stage_resources.map(r=>r.resource_id)).toEqual(["gfg"]);
    expect(result.stages[1].stage_resources[0].resources.price).toBe(7999);
    expect(option.stages[1].stage_resources).toHaveLength(0);
    expect(includePurchased(result,["gfg"]).stages[1].stage_resources).toHaveLength(1);
  });
  it("does not treat a visit as a purchase",()=>expect(includePurchased(option,[]).stages[1].stage_resources).toHaveLength(0));
  it("rejects forged resource identifiers",()=>expect(()=>includePurchased(option,["unoffered"])).toThrow());
});
