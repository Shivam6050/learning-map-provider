import {afterEach,expect,it,vi} from "vitest";
import {GET} from "./route";
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
it("protects the editorial maintenance report",async()=>{vi.stubEnv("CRON_SECRET","test");expect((await GET(new Request("https://example.com"))).status).toBe(401);});
it("reports expired source reviews without renewing their dates",async()=>{
 vi.stubEnv("CRON_SECRET","test");vi.spyOn(Date,"now").mockReturnValue(Date.parse("2027-02-01"));vi.spyOn(console,"warn").mockImplementation(()=>{});
 const result=await (await GET(new Request("https://example.com",{headers:{authorization:"Bearer test"}}))).json();
 expect(result.due).toBeGreaterThan(0);expect(result.items[0]).toMatchObject({checkedAt:"2026-10-02",status:"expired"});
});
