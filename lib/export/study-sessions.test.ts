import {expect,it} from "vitest";
import {parseStudyDays,studySessions} from "./study-sessions";
it("defaults only when study days are omitted",()=>{expect(parseStudyDays(null)).toEqual([1,2,3,4,5]);});
it.each([""," ",",","1,","1,,2","7","-1","1.5","Sunday"])("rejects invalid day selection %j",value=>{expect(()=>parseStudyDays(value)).toThrow("Choose at least one valid study day");});
it("preserves an explicitly selected Sunday",()=>{expect(parseStudyDays("0")).toEqual([0]);});
it("deduplicates selected days",()=>{expect(parseStudyDays("1, 3,1")).toEqual([1,3]);});
it("schedules Sunday only when explicitly selected",()=>{const sessions=studySessions([{id:"one",title:"Study",description:"",estimated_hours:2}],2,"2026-10-01","09:00",parseStudyDays("0"));expect(sessions).toHaveLength(1);expect(sessions[0].start).toBe("20261004T090000");expect(sessions[0].minutes).toBe(120);});
