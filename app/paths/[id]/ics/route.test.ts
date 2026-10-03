import {beforeEach,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({from:vi.fn(),path:vi.fn(),stages:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({from:m.from})}));
import {GET} from "./route";
const id="112c786a-621a-819d-af6f-7b41c45df4ae";
const path={id,weekly_hours:10,created_at:"2026-10-01T00:00:00Z",fields:{name:"Backend Development"}};
const stages=[{id:"stage",title:"Build an API",description:"HTTP and routes",estimated_hours:2}];
beforeEach(()=>{
 vi.resetAllMocks();m.path.mockResolvedValue({data:path,error:null});m.stages.mockResolvedValue({data:stages,error:null});
 m.from.mockImplementation((table:string)=>{const query={select:vi.fn(),eq:vi.fn(),maybeSingle:m.path,order:m.stages};query.select.mockReturnValue(query);query.eq.mockReturnValue(query);if(!["learning_paths","stages"].includes(table))throw Error("Unexpected table");return query;});
});
function request(query="date=2026-10-05&time=09:00&days=1,2,3,4,5",pathId=id){return GET(new Request("https://learningmap.example/paths/"+pathId+"/ics?"+query),{params:Promise.resolve({id:pathId})});}
it("exports actual timed sessions with private download headers",async()=>{
 const response=await request();expect(response.status).toBe(200);expect(response.headers.get("content-type")).toContain("text/calendar");expect(response.headers.get("cache-control")).toBe("private, no-store");expect(response.headers.get("content-disposition")).toContain("attachment");const body=await response.text();expect(body).toContain("BEGIN:VEVENT");expect(body).toContain("DTSTART:20261005T090000");expect(body).toContain("DTEND:20261005T110000");
});
it("returns temporary failure rather than 404 when the roadmap query fails",async()=>{
 m.path.mockResolvedValue({data:null,error:{message:"private database detail"}});const response=await request();expect(response.status).toBe(503);expect(await response.text()).not.toContain("private database detail");expect(m.stages).not.toHaveBeenCalled();
});
it("does not download an empty file on stage query failure",async()=>{
 m.stages.mockResolvedValue({data:null,error:{message:"Gateway Timeout"}});const response=await request();expect(response.status).toBe(503);expect(response.headers.get("content-disposition")).toBeNull();expect(await response.json()).toEqual({error:"Could not load your learning stages. Please try again shortly."});
});
it.each([null,[]])("rejects missing stages instead of substituting an empty schedule",async data=>{
 m.stages.mockResolvedValue({data,error:null});const response=await request();expect(response.status).toBe(409);expect(response.headers.get("content-disposition")).toBeNull();
});
it("rejects a roadmap with no scheduled study time",async()=>{
 m.stages.mockResolvedValue({data:[{...stages[0],estimated_hours:0}],error:null});expect((await request()).status).toBe(409);
});
it.each(["path","stages"] as const)("handles a thrown %s network error without leaking details",async step=>{
 m[step].mockRejectedValue(new Error("private network detail"));const response=await request();expect(response.status).toBe(503);expect(await response.text()).not.toContain("private network detail");expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it("preserves owner-RLS not-found behavior",async()=>{
 m.path.mockResolvedValue({data:null,error:null});expect((await request()).status).toBe(404);expect(m.stages).not.toHaveBeenCalled();
});
it("still reports invalid study days as schedule errors",async()=>{
 expect((await request("date=2026-10-05&time=09:00&days=")).status).toBe(400);
});
it("rejects malformed roadmap IDs before querying the database",async()=>{
 expect((await request("","invalid")).status).toBe(400);expect(m.from).not.toHaveBeenCalled();
});
