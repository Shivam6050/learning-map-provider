vi.mock("server-only",()=>({}));
import {afterEach,beforeEach,expect,it,vi} from "vitest";
const authentication=vi.hoisted(()=>vi.fn());
vi.mock("./keys",()=>({authenticateAgent:authentication}));
import {POST} from "@/app/mcp/route";
import {GET as catalog} from "@/app/api/public/catalog/route";
import {GET as roadmap} from "@/app/api/public/roadmap/route";
import {agentPreflight} from "./http";
beforeEach(()=>{vi.stubEnv("NEXT_PUBLIC_SITE_URL","https://learningmap.example");authentication.mockReset();authentication.mockResolvedValue({status:"unauthorized"});});afterEach(()=>vi.unstubAllEnvs());
it.each(["mcp","catalog","roadmap"])("requires authentication before accessing %s services",async name=>{
 const req=new Request("https://learningmap.example/"+name,{method:name==="mcp"?"POST":"GET",...(name==="mcp"?{headers:{"Content-Type":"application/json",Accept:"application/json, text/event-stream"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/list"})}:{})});
 const response=await (name==="mcp"?POST(req):name==="catalog"?catalog(req):roadmap(req));
 expect(response.status).toBe(401);expect(response.headers.get("WWW-Authenticate")).toContain("Bearer");expect(response.headers.get("Cache-Control")).toBe("no-store");expect(await response.text()).not.toContain("resources");
});
it("does not turn authentication failure into tool or catalog access",async()=>{
 authentication.mockResolvedValue({status:"unavailable"});const response=await catalog(new Request("https://learningmap.example/api/public/catalog"));expect(response.status).toBe(503);expect(await response.text()).not.toContain("internal");
});
it("allows credential preflight without exposing protected data",()=>{
 const response=agentPreflight(new Request("https://learningmap.example/api/public/catalog",{method:"OPTIONS",headers:{Origin:"https://learningmap.example"}}));expect(response.status).toBe(204);expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Authorization");expect(response.headers.has("Access-Control-Allow-Credentials")).toBe(false);expect(authentication).not.toHaveBeenCalled();
});
it("serves catalog data only after successful authorization",async()=>{
 authentication.mockResolvedValue({status:"authorized",userId:"owner"});const response=await catalog(new Request("https://learningmap.example/api/public/catalog"));expect(response.status).toBe(200);expect((await response.json()).fields).toHaveLength(6);expect(response.headers.get("Cache-Control")).toBe("no-store");
});
