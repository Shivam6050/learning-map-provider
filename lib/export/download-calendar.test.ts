import {afterEach,expect,it,vi} from "vitest";
import {fetchCalendar} from "./download-calendar";
afterEach(()=>vi.unstubAllGlobals());
function reply(body:string,status:number,type:string){vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(body,{status,headers:{"content-type":type}})));}
it("downloads valid calendars",async()=>{reply("BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",200,"text/calendar");expect((await fetchCalendar("/calendar")).type).toContain("text/calendar");});
it("surfaces schedule validation errors",async()=>{reply(JSON.stringify({error:"Choose an earlier start time"}),400,"application/json");await expect(fetchCalendar("/calendar")).rejects.toThrow("Choose an earlier start time");});
it("rejects login HTML instead of downloading it",async()=>{reply("<html>Sign in</html>",200,"text/html");await expect(fetchCalendar("/calendar")).rejects.toThrow("sign in again");});
it("rejects truncated calendar files",async()=>{reply("BEGIN:VCALENDAR",200,"text/calendar");await expect(fetchCalendar("/calendar")).rejects.toThrow("incomplete");});
it("handles expired sessions",async()=>{reply("",401,"application/json");await expect(fetchCalendar("/calendar")).rejects.toThrow("session may have expired");});
it("does not expose server error details",async()=>{reply("private database error",500,"text/plain");await expect(fetchCalendar("/calendar")).rejects.toThrow("Please try again shortly");});
