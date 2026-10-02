import {expect,it} from "vitest";
import {optionalExercises,startingGuidance} from "./preparation";
it("provides bounded optional exercises relevant to the stage",()=>{const exercises=optionalExercises("HTTP SQL Security",null);expect(exercises).toHaveLength(2);expect(exercises[0].title).toBe("Explore API versioning");});
it("does not invent specialist extensions for unknown fields",()=>{expect(optionalExercises("Watercolour",null)).toEqual([]);});
it("supports each level and safe fallback for legacy paths",()=>{expect(startingGuidance("advanced")).toContain("demonstrate");expect(startingGuidance("intermediate")).toContain("fill gaps");expect(startingGuidance(undefined)).toBe(startingGuidance("beginner"));});

it("retains optional exploration for curated concepts without duplicate exercises",()=>{const items=optionalExercises("React Component Architecture & State",null);expect(items).toHaveLength(1);});
