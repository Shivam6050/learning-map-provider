import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getUser } }) }));
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
