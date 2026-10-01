import {expect,it} from "vitest";
import {stageTopics} from "./topics";
it("derives relevant checks without confusing performance with ORM",()=>{expect(stageTopics("Performance and caching",null).map(t=>t.id)).toEqual(["performance"]);});
it("does not treat a database model as a prediction model",()=>{expect(stageTopics("SQL data modelling",null).map(t=>t.id)).toEqual(["data"]);});
it("provides an original fallback for an unfamiliar field",()=>{expect(stageTopics("Watercolour fundamentals",null)[0].id).toBe("foundations");});
it("uses stable identifiers and limits the checklist size",()=>{const topics=stageTopics("HTTP databases security testing deploy performance React",null);expect(topics).toHaveLength(5);expect(new Set(topics.map(t=>t.id)).size).toBe(5);});
