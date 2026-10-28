vi.mock("server-only",()=>({}));
import {expect,it,vi} from "vitest";
import {matchingSeeds,resourceContext} from "./resource-replacements";
import type {SupabaseClient} from "@supabase/supabase-js";
it("matches the stage's topic rather than forcing every provider into unrelated stages",()=>{const seeds=matchingSeeds({title:"SQL Queries and Joins",description:"Write SQL queries and use PostgreSQL joins."},"backend-development");expect(seeds.length).toBeGreaterThan(0);expect(seeds.some(seed=>seed.url.includes("w3schools.com/sql"))).toBe(true);expect(seeds.every(seed=>seed.url.startsWith("https://"))).toBe(true);expect(seeds.some(seed=>seed.url.includes("react"))).toBe(false);});
it("never creates alternatives for an unrelated unknown subject",()=>{expect(matchingSeeds({title:"Ancient pottery",description:"Make a clay bowl"},"backend-development")).toEqual([]);});
it("does not fall back to a different field's private selection",()=>{expect(matchingSeeds({title:"Kubernetes orchestration",description:""},"frontend-development").every(seed=>!seed.field_slug||seed.field_slug==="frontend-development")).toBe(true);});
it("binds the path lookup to the signed-in owner before reading stages",async()=>{
 const from=vi.fn();const filters:unknown[]=[];const q={select:()=>q,eq:(key:string,value:unknown)=>{filters.push([key,value]);return q;},maybeSingle:async()=>({data:null,error:null})};from.mockReturnValue(q);
 await expect(resourceContext({from} as unknown as SupabaseClient,"owner","path","stage","resource")).rejects.toThrow("unavailable");expect(filters).toContainEqual(["user_id","owner"]);expect(filters).toContainEqual(["id","path"]);expect(from).toHaveBeenCalledTimes(1);
});
