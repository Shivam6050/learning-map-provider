import { expect, it } from "vitest";
import { parseRoadmapPreferences } from "./preferences";
import { computeStageTimeline } from "./timeline";
import { pathCost } from "@/lib/pricing/path-cost";
it.each([["1","0"],["80","100000"],["17","5000.50"]])("accepts preference boundaries %s / %s", (hours,budget) => {
 expect(parseRoadmapPreferences(hours,budget)).toEqual({weeklyHours:Number(hours),budgetTotal:Number(budget)});
});
it.each([[null,"1"],["","1"],["1",null],["1", ""],["0","0"],["81","1"],["1.5","1"],["1","-1"],["1","100001"],["1","1.001"],["1","NaN"],["Infinity","1"],["1","1e4"]])("rejects malformed preferences %s / %s", (hours,budget) => {
 expect(parseRoadmapPreferences(hours,budget)).toBeNull();
});
it("uses the saved pace for timeline and shared subscription renewal estimates", () => {
 const stages=[{id:"one",estimated_hours:100,resources:[{url:"https://scrimba.com/course",price:50,signals:{price_source:"scrimba_regional_plan",billing_interval:"month"}}]}];
 expect(computeStageTimeline(stages,10).totalWeeks).toBe(10);
 expect(computeStageTimeline(stages,5).totalWeeks).toBe(20);
 expect(pathCost(stages,10).total).toBe(150);
 expect(pathCost(stages,5).total).toBe(250);
});
