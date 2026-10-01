import {afterEach,expect,it,vi} from "vitest";
import {sealCalendar,openCalendar,sameOrigin} from "./google-session";
import {googleEvents,insertGoogleEvent} from "./google-events";
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it("encrypts calendar tokens and rejects tampering and expiry",()=>{
 vi.stubEnv("GOOGLE_CALENDAR_COOKIE_KEY","a".repeat(64));
 const sealed=sealCalendar({accessToken:"private-token",userId:"one",expires:Date.now()+60000});
 expect(sealed).not.toContain("private-token");expect(openCalendar(sealed)).toMatchObject({userId:"one"});
 expect(openCalendar(sealed.slice(0,-4)+"AAAA")).toBeNull();
 expect(openCalendar(sealCalendar({expires:Date.now()-1}))).toBeNull();
});
it("rejects missing or cross-site origins",()=>{
 expect(sameOrigin(new Request("https://example.com"),"https://example.com")).toBe(false);
 expect(sameOrigin(new Request("https://example.com",{headers:{origin:"https://example.com","sec-fetch-site":"cross-site"}}),"https://example.com")).toBe(false);
});
it("builds deterministic timed events from weekly commitment",()=>{
 const args=["path","Backend",[{id:"stage",title:"APIs",description:"Learn",estimated_hours:4}],4,"2026-10-01","09:00",[1,2],"Asia/Kolkata"] as const;
 const events=googleEvents(args[0],args[1],[...args[2]],args[3],args[4],args[5],[...args[6]],args[7]);
 expect(events).toHaveLength(2);expect(events[0].start.timeZone).toBe("Asia/Kolkata");
 expect(events[0].end.dateTime.slice(-8)).toBe("11:00:00");
 expect(events[0].id).toMatch(/^[a-f0-9]{64}$/);
 expect(()=>googleEvents("p","f",[],1,"2026-10-01","09:00",[1],"invalid-zone")).toThrow("time zone");
});
it("verifies duplicate events before treating a retry as successful",async()=>{
 const event=googleEvents("p","Backend",[{id:"s",title:"APIs",description:"",estimated_hours:1}],1,"2026-10-01","09:00",[1],"Asia/Kolkata")[0];
 vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(new Response(null,{status:409})).mockResolvedValueOnce(Response.json({...event,status:"confirmed"})));
 await expect(insertGoogleEvent("secret",event)).resolves.toBe("existing");
});
