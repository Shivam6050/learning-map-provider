import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ client: vi.fn(), after: vi.fn(), log: vi.fn() }));
vi.mock("next/server", () => ({ after: m.after }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: m.client }));
vi.mock("@/lib/monitoring/log-error", () => ({ logError: m.log }));
import { loadRoadmapTemplate } from "./load";
const id = "12345678-1234-1234-1234-123456789abc";
const template = () => ({ field_slug: "backend-development", skill_level: "beginner", version: 42, valid_until: "2099-01-01T00:00:00Z", stages: [{ order_index: 0, title: "HTTP", description: "Learn HTTP", estimated_hours: 4, search_topics: ["http"], practice_check: "Build an API", resource_ids: [id] }] });
const resource = () => ({ id, title: "HTTP", url: "https://example.com/http", platform: "docs", resource_type: "docs", price: 0, currency: "USD", signals: {}, trust_status: "allowlisted", rating: null, link_status: "ok" });
function setup() {
  const state = { data: template() as unknown, resources: [resource()] as Record<string, unknown>[], templateError: null as unknown, resourceError: null as unknown, afterTemplate: () => {}, afterResources: () => {} };
  const templateQuery = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => { state.afterTemplate(); return { data: state.data, error: state.templateError }; }) };
  const resourceQuery = { select: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), abortSignal: vi.fn(async (signal: AbortSignal) => { void signal; state.afterResources(); return { data: state.resources, error: state.resourceError }; }) };
  const from = vi.fn((table: string) => table === "roadmap_templates" ? templateQuery : resourceQuery);
  m.client.mockReturnValue({ from }); return { state, from, templateQuery, resourceQuery };
}
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, "warn").mockImplementation(() => {}); vi.spyOn(console, "error").mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());
const load = () => loadRoadmapTemplate("backend-development", "beginner", "INR");
it("loads the requested curriculum with the learner's display currency", async () => {
  const { templateQuery } = setup(); const result = await load(); expect(result?.version).toBe(42); expect(result?.stages[0].candidates[0].currency).toBe("INR");
  expect(templateQuery.eq).toHaveBeenCalledWith("field_slug", "backend-development"); expect(templateQuery.eq).toHaveBeenCalledWith("skill_level", "beginner"); expect(templateQuery.eq).toHaveBeenCalledWith("status", "published"); expect(m.after).not.toHaveBeenCalled();
});
it("uses one three-second abort signal across both database reads", async () => {
  const { templateQuery, resourceQuery } = setup(); const timeout = vi.spyOn(AbortSignal, "timeout"); await load();
  expect(timeout).toHaveBeenCalledExactlyOnceWith(3000); expect(templateQuery.abortSignal.mock.calls[0][0]).toBe(resourceQuery.abortSignal.mock.calls[0][0]);
});
it("does not start resource lookup once the shared deadline expires", async () => {
  const { state, resourceQuery } = setup(); const controller = new AbortController(); vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
  state.afterTemplate = () => controller.abort(); expect(await load()).toBeNull(); expect(resourceQuery.select).not.toHaveBeenCalled();
});
it("rejects a resource response arriving after the shared deadline", async () => {
  const { state } = setup(); const controller = new AbortController(); vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
  state.afterResources = () => controller.abort(); expect(await load()).toBeNull();
});
it.each([null, {}, { ...template(), valid_until: "2000-01-01" }, { ...template(), field_slug: "wrong" }])("falls back on missing, invalid, expired or mismatched templates", async data => {
  const { state, resourceQuery } = setup(); state.data = data; expect(await load()).toBeNull(); expect(resourceQuery.select).not.toHaveBeenCalled();
});
it.each([{ price: 10 }, { price: null }, { signals: { price_unverified: true } }, { trust_status: "rejected" }, { link_status: "broken" }, { url: "http://127.0.0.1/private" }])("does not accept an unusable resource: %s", async override => {
  const { state } = setup(); state.resources = [{ ...resource(), ...override }]; expect(await load()).toBeNull();
});
it("requires usable coverage for every stage", async () => {
  const { state } = setup(); const data = template(); data.stages.push({ ...data.stages[0], order_index: 1, resource_ids: ["22345678-1234-1234-1234-123456789abc"] }); state.data = data;
  expect(await load()).toBeNull();
});
it("uses a surviving verified free candidate when another one becomes unusable", async () => {
  const { state } = setup(); const second = "22345678-1234-1234-1234-123456789abc"; const data = template(); data.stages[0].resource_ids.push(second); state.data = data;
  state.resources.push({ ...resource(), id: second, price: 10 }); expect((await load())?.stages[0].candidates.map(row => row.id)).toEqual([id]);
});
it("does not use a template that expires while its resources are loading", async () => {
  const { state } = setup(); let now = Date.now(); vi.spyOn(Date, "now").mockImplementation(() => now);
  state.data = { ...template(), valid_until: new Date(now + 1000).toISOString() }; state.afterResources = () => { now += 2000; };
  expect(await load()).toBeNull();
});
it.each(["templateError", "resourceError"] as const)("defers sanitized monitoring for %s until after the response", async key => {
  const { state } = setup(); state[key] = { message: "private@example.com token=private" }; m.log.mockResolvedValue(undefined);
  expect(await load()).toBeNull(); expect(m.log).not.toHaveBeenCalled(); expect(m.after).toHaveBeenCalledTimes(1);
  await m.after.mock.calls[0][0](); expect(m.log).toHaveBeenCalledTimes(1); expect(String(m.log.mock.calls[0][1])).not.toMatch(/private@example|token=/);
});
it("falls back even when no after-response context is available", async () => {
  m.client.mockImplementation(() => { throw new Error("private credentials"); }); m.after.mockImplementation(() => { throw new Error("No request context"); });
  expect(await load()).toBeNull(); expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private credentials");
});
