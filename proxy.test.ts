import "server-only";
vi.mock("server-only",()=>({}));
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { getUser, cookieHooks } = vi.hoisted(() => ({ getUser: vi.fn(), cookieHooks: { setAll: null as null | ((cookies: {name:string;value:string;options:Record<string,unknown>}[], headers?: Record<string,string>) => void) } }));
vi.mock("@supabase/ssr", () => ({ createServerClient: (...args: unknown[]) => { cookieHooks.setAll = (args[2] as {cookies:{setAll:NonNullable<typeof cookieHooks.setAll>}}).cookies.setAll; return { auth: { getUser } }; } }));
import { proxy } from "./proxy";
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test-key");
  getUser.mockReset();
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
it("routes homepage authorization codes to the exchange handler without checking a nonexistent session", async () => {
  const result = await proxy(new NextRequest("http://localhost:3102/?code=test-code&next=https://evil.example"));
  expect(result.headers.get("location")).toBe("http://localhost:3102/auth/callback?code=test-code&next=%2Fdashboard");
  expect(result.headers.get("cache-control")).toBe("private, no-store");
  expect(getUser).not.toHaveBeenCalled();
});
it("leaves the callback session exchange to the route handler", async () => {
  await proxy(new NextRequest("http://localhost:3102/auth/callback?code=test-code"));
  expect(getUser).not.toHaveBeenCalled();
});
it("does not sign out a user whose validation takes longer than 1.5 seconds", async () => {
  vi.useFakeTimers();
  getUser.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({data:{user:{id:"user"}},error:null}), 2000)));
  const result = proxy(new NextRequest("http://localhost:3102/dashboard"));
  await vi.advanceTimersByTimeAsync(2100);
  expect((await result).headers.get("location")).toBeNull();
});
it("still redirects a genuinely unauthenticated request", async () => {
  getUser.mockResolvedValue({data:{user:null},error:null});
  const result = await proxy(new NextRequest("http://localhost:3102/dashboard"));
  expect(result.headers.get("location")).toBe("http://localhost:3102/login?next=%2Fdashboard");
});
it("overrides injected policies and supplies a fresh nonce for every page render", async () => {
  getUser.mockResolvedValue({data:{user:null},error:null});
  const first = await proxy(new NextRequest("http://localhost:3102/login", {headers:{"Content-Security-Policy":"script-src *"}}));
  const second = await proxy(new NextRequest("http://localhost:3102/login"));
  const policy = first.headers.get("content-security-policy")!;
  expect(policy).toContain("'strict-dynamic'");
  expect(policy).not.toContain("script-src *");
  expect(first.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
  expect(second.headers.get("content-security-policy")).not.toBe(policy);
});

it("retains the CSP and refreshed session cookies when auth rebuilds the response", async () => {
  getUser.mockImplementation(async () => {
    cookieHooks.setAll!([{name:"refreshed-session",value:"test-session",options:{httpOnly:true}}]);
    return {data:{user:{id:"owner"}},error:null};
  });
  const result = await proxy(new NextRequest("http://localhost:3102/dashboard"));
  expect(result.cookies.get("refreshed-session")?.value).toBe("test-session");
  const policy = result.headers.get("content-security-policy");
  expect(policy).toContain("'strict-dynamic'");
  expect(result.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
});

it.each(["/mcp", "/api/public/catalog", "/api/public/roadmap", "/llms.txt", "/robots.txt", "/sitemap.xml"])("serves public integration route %s without auth calls or session cookies", async path => {
  const result = await proxy(new NextRequest("http://localhost:3102"+path,{headers:{cookie:"private=session"}}));
  expect(getUser).not.toHaveBeenCalled();
  expect(result.headers.has("set-cookie")).toBe(false);
});
it("does not exempt similarly named private or future API routes", async () => {
  getUser.mockResolvedValue({data:{user:null},error:null});
  await proxy(new NextRequest("http://localhost:3102/api/public/catalog/private"));
  expect(getUser).toHaveBeenCalledOnce();
});

it.each(["/settings","/paths/test","/onboarding/select","/auth/callback","/reset-password"])("does not cache sensitive route %s", async path => {
 getUser.mockResolvedValue({data:{user:null},error:null});
 const result=await proxy(new NextRequest("http://localhost:3102"+path));
 expect(result.headers.get("cache-control")).toBe("private, no-store");
 expect(result.headers.get("referrer-policy")).toBe("no-referrer");
});
it("does not cache a signed-in navbar on public pages", async()=>{
 getUser.mockResolvedValue({data:{user:{id:"owner"}},error:null});
 const result=await proxy(new NextRequest("http://localhost:3102/privacy",{headers:{cookie:"sb-test-auth-token.0=fixture"}}));
 expect(result.headers.get("cache-control")).toBe("private, no-store");
});
it("retains SDK anti-cache headers on token refresh and protects session cookies", async()=>{
 vi.stubEnv("NODE_ENV","production");
 getUser.mockImplementation(async()=>{
  cookieHooks.setAll!([{name:"sb-test-auth-token",value:"fixture",options:{httpOnly:false,secure:false}}],{"Cache-Control":"private, no-cache, no-store, must-revalidate, max-age=0","Pragma":"no-cache","Expires":"0"});
  return {data:{user:{id:"owner"}},error:null};
 });
 const result=await proxy(new NextRequest("https://example.com/privacy"));
 expect(result.headers.get("cache-control")).toContain("no-store");
 expect(result.headers.get("pragma")).toBe("no-cache");
 expect(result.cookies.get("sb-test-auth-token")).toMatchObject({httpOnly:true,secure:true,sameSite:"lax"});
});


it.each(["/login", "/signup", "/forgot-password", "/reset-password", "/dashboard", "/settings/security", "/paths/owner-path", "/onboarding", "/auth/callback"])("prevents indexing of account and private route %s even on redirects", async path => {
  getUser.mockResolvedValue({data:{user:null},error:null});
  const result = await proxy(new NextRequest("http://localhost:3102"+path));
  expect(result.headers.get("x-robots-tag")).toBe("noindex, nofollow");
});
it.each(["/", "/roadmaps", "/roadmaps/backend-development", "/privacy", "/integrations"])("keeps public route %s indexable without exposing cached signed-in details", async path => {
  getUser.mockResolvedValue({data:{user:{id:"owner"}},error:null});
  const result = await proxy(new NextRequest("http://localhost:3102"+path,{headers:{cookie:"sb-test-auth-token.0=fixture"}}));
  expect(result.headers.get("x-robots-tag")).toBeNull();
  expect(result.headers.get("cache-control")).toBe("private, no-store");
});

it.each(["/roadmaps/unknown-field", "/roadmaps/backend-development/extra", "/roadmaps/%3Cscript%3E", "/roadmaps/%FF"])("rejects invalid public guide %s before rendering or authentication", async path => {
  const result = await proxy(new NextRequest("http://localhost:3102"+path));
  expect(result.status).toBe(404);
  expect(result.headers.get("x-robots-tag")).toBe("noindex");
  expect(result.headers.get("content-type")).toContain("text/html");
  expect(await result.text()).toContain('href="/roadmaps"');
  expect(getUser).not.toHaveBeenCalled();
});
it("supports encoded canonical guide slugs without reflecting input in the error HTML", async () => {
  getUser.mockResolvedValue({data:{user:null},error:null});
  const result = await proxy(new NextRequest("http://localhost:3102/roadmaps/backend%2Ddevelopment"));
  expect(result.status).toBe(200);
  expect(result.headers.get("x-robots-tag")).toBeNull();
});
