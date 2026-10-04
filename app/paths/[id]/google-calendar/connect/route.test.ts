import {beforeEach,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({client:vi.fn(),user:vi.fn(),configured:vi.fn(),seal:vi.fn(),set:vi.fn(),query:{select:vi.fn(),eq:vi.fn(),maybeSingle:vi.fn()}}));
vi.mock("next/headers",()=>({cookies:async()=>({set:m.set})}));
vi.mock("@/lib/supabase/server",()=>({createClient:m.client}));
vi.mock("@/lib/auth/learning-user",()=>({getLearningUser:m.user}));
vi.mock("@/lib/site",()=>({getRequestOrigin:()=>"https://example.com"}));
vi.mock("@/lib/calendar/google-session",()=>({calendarConfigured:m.configured,sameOrigin:(r:Request,o:string)=>r.headers.get("origin")===o,STATE_COOKIE:"calendar-state",sealCalendar:m.seal,cookieOptions:{httpOnly:true,secure:true,sameSite:"lax"},CALENDAR_SCOPE:"https://www.googleapis.com/auth/calendar.events.owned"}));
import {POST} from "./route";
const id="112c786a-621a-819d-af6f-7b41c45df4ae",context={params:Promise.resolve({id})};
const request=(accept="application/json",origin="https://example.com")=>new Request(`https://example.com/paths/${id}/google-calendar/connect`,{method:"POST",headers:{accept,origin}});
beforeEach(()=>{
 vi.clearAllMocks();m.query.select.mockReturnThis();m.query.eq.mockReturnThis();m.query.maybeSingle.mockResolvedValue({data:{id},error:null});
 m.client.mockResolvedValue({from:()=>m.query});m.user.mockResolvedValue({data:{user:{id:"owner"}}});m.configured.mockReturnValue(true);m.seal.mockReturnValue("encrypted-state");
});
it("returns a fixed OAuth URL with PKCE after ownership verification",async()=>{
 const response=await POST(request(),context);expect(response.status).toBe(200);expect(response.headers.get("location")).toBeNull();expect(response.headers.get("cache-control")).toContain("no-store");
 const url=new URL((await response.json()).authorizationUrl);expect(url.origin).toBe("https://accounts.google.com");expect(url.pathname).toBe("/o/oauth2/v2/auth");expect(url.searchParams.get("code_challenge_method")).toBe("S256");expect(url.searchParams.get("redirect_uri")).toBe("https://example.com/auth/google-calendar/callback");
 expect(m.query.eq).toHaveBeenCalledWith("user_id","owner");expect(m.set).toHaveBeenCalledWith("calendar-state","encrypted-state",expect.objectContaining({httpOnly:true,secure:true,maxAge:600}));
});
it("keeps the existing native redirect response contract",async()=>{expect((await POST(request("text/html"),context)).status).toBe(303);});
it("rejects cross-origin initiation before loading the account",async()=>{expect((await POST(request("application/json","https://evil.example"),context)).status).toBe(403);expect(m.client).not.toHaveBeenCalled();});
it("returns a JSON auth error without a fetch redirect",async()=>{m.user.mockResolvedValue({data:{user:null}});expect((await POST(request(),context)).status).toBe(401);expect(m.set).not.toHaveBeenCalled();});
it("does not create state for a different user's roadmap",async()=>{m.query.maybeSingle.mockResolvedValue({data:null,error:null});expect((await POST(request(),context)).status).toBe(404);expect(m.set).not.toHaveBeenCalled();});
it("reports missing configuration without redirecting fetch",async()=>{m.configured.mockReturnValue(false);expect((await POST(request(),context)).status).toBe(503);expect(m.set).not.toHaveBeenCalled();});
