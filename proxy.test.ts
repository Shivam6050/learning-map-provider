import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { getUser, cookieHooks } = vi.hoisted(() => ({ getUser: vi.fn(), cookieHooks: { setAll: null as null | ((cookies: {name:string;value:string;options:Record<string,unknown>}[]) => void) } }));
vi.mock("@supabase/ssr", () => ({ createServerClient: (...args: unknown[]) => { cookieHooks.setAll = (args[2] as {cookies:{setAll:NonNullable<typeof cookieHooks.setAll>}}).cookies.setAll; return { auth: { getUser } }; } }));
import { proxy } from "./proxy";
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
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
