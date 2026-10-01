import {beforeEach,afterEach,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({client:vi.fn(),learningUser:vi.fn(),open:vi.fn(),insert:vi.fn(),jar:{get:vi.fn(),delete:vi.fn()}}));
vi.mock("next/headers",()=>({cookies:async()=>m.jar}));
vi.mock("@/lib/supabase/server",()=>({createClient:m.client}));
vi.mock("@/lib/auth/learning-user",()=>({getLearningUser:m.learningUser}));
vi.mock("@/lib/site",()=>({getRequestOrigin:()=>"https://example.com"}));
vi.mock("@/lib/calendar/google-session",()=>({TOKEN_COOKIE:"calendar",STATE_COOKIE:"calendar-state",openCalendar:m.open,calendarConfigured:()=>true,sameOrigin:(r:Request,o:string)=>r.headers.get("origin")===o}));
vi.mock("@/lib/calendar/google-events",async importOriginal=>({...await importOriginal<typeof import("@/lib/calendar/google-events")>(),insertGoogleEvent:m.insert}));
import {GET,POST,DELETE} from "./route";
import {CalendarConnectionExpired} from "@/lib/calendar/google-events";
const id="112c786a-621a-819d-af6f-7b41c45df4ae";
const context={params:Promise.resolve({id})};
const request=(body:unknown={date:"2026-10-01",time:"09:00",days:[1],timeZone:"Asia/Kolkata"},origin="https://example.com")=>new Request(`https://example.com/paths/${id}/google-calendar`,{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify(body)});
let pathQuery:ReturnType<typeof query>,stageQuery:ReturnType<typeof query>,from:ReturnType<typeof vi.fn>;
function query(){return {select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn(),order:vi.fn()};}
beforeEach(()=>{
 pathQuery=query();stageQuery=query();pathQuery.maybeSingle.mockResolvedValue({data:{id,weekly_hours:1,fields:{name:"Backend"}},error:null});
 stageQuery.order.mockResolvedValue({data:[{id:"stage",title:"APIs",description:"",estimated_hours:3}],error:null});
 from=vi.fn(table=>table==="learning_paths"?pathQuery:stageQuery);
 m.client.mockResolvedValue({from,auth:{getUser:async()=>({data:{user:{id:"owner"}}})}});
 m.learningUser.mockResolvedValue({data:{user:{id:"owner"}}});m.open.mockReturnValue({userId:"owner",accessToken:"token"});m.insert.mockResolvedValue("added");
});
afterEach(()=>vi.resetAllMocks());
it("rejects cross-origin insertion before loading an account",async()=>{expect((await POST(request({},"https://evil.example"),context)).status).toBe(403);expect(m.client).not.toHaveBeenCalled();});
it("rejects another user's calendar connection",async()=>{m.open.mockReturnValue({userId:"other",accessToken:"token"});expect((await POST(request(),context)).status).toBe(401);expect(from).not.toHaveBeenCalled();});
it("checks roadmap ownership before loading stages or creating events",async()=>{pathQuery.maybeSingle.mockResolvedValue({data:null,error:null});expect((await POST(request(),context)).status).toBe(404);expect(pathQuery.eq).toHaveBeenCalledWith("user_id","owner");expect(from).not.toHaveBeenCalledWith("stages");expect(m.insert).not.toHaveBeenCalled();});
it("rejects null schedule bodies without crashing",async()=>{expect((await POST(request(null),context)).status).toBe(400);});
it("limits imports to two events and returns the next position",async()=>{const r=await POST(request(),context);expect(await r.json()).toMatchObject({added:2,nextOffset:2,total:3,complete:false});expect(m.insert).toHaveBeenCalledTimes(2);});
it("reports the failed position after partial success",async()=>{m.insert.mockResolvedValueOnce("added").mockRejectedValueOnce(new Error("Provider unavailable"));const r=await POST(request(),context);expect(r.status).toBe(502);expect(await r.json()).toMatchObject({added:1,nextOffset:1,reconnect:false});});
it("clears rejected tokens and exposes reconnection",async()=>{m.insert.mockRejectedValue(new CalendarConnectionExpired("Connect again"));const r=await POST(request(),context);expect(r.status).toBe(401);expect(await r.json()).toMatchObject({reconnect:true,nextOffset:0});expect(m.jar.delete).toHaveBeenCalledWith("calendar");});
it("does not show a malformed token as connected",async()=>{m.open.mockReturnValue({userId:"owner"});expect(await (await GET()).json()).toMatchObject({connected:false});});

it("disconnects both the connection and pending authorization without modifying Google events",async()=>{const r=await DELETE(new Request("https://example.com/calendar",{method:"DELETE",headers:{origin:"https://example.com"}}));expect(await r.json()).toEqual({disconnected:true});expect(m.jar.delete).toHaveBeenCalledWith("calendar");expect(m.jar.delete).toHaveBeenCalledWith("calendar-state");expect(m.insert).not.toHaveBeenCalled();});
it("rejects cross-origin disconnection before changing cookies",async()=>{expect((await DELETE(new Request("https://example.com/calendar",{method:"DELETE",headers:{origin:"https://evil.example"}}))).status).toBe(403);expect(m.jar.delete).not.toHaveBeenCalled();});
