import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ blueprints: vi.fn(), inspect: vi.fn(), videos: vi.fn(), client: vi.fn(), insert: vi.fn(), upsert: vi.fn() }));
vi.mock("./blueprints", () => ({ templateBlueprints: m.blueprints }));
vi.mock("@/lib/link-check/check-url", () => ({ inspectUrl: m.inspect }));
vi.mock("@/lib/youtube/client", () => ({ getVideoStats: m.videos }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: m.client }));
import { publishRoadmapTemplates, TemplatePublicationError } from "./publish";
const id = "12345678-1234-1234-1234-123456789abc";
const resource = { title: "HTTP tutorial", url: "https://example.com/http", platform: "docs", resource_type: "article", price: 0 };
const blueprint = () => ({ field_slug: "backend-development", skill_level: "beginner", stages: [{ order_index: 0, title: "HTTP", description: "Learn HTTP", estimated_hours: 4, search_topics: ["http"], practice_check: "Build an API", resources: [resource] }] });
function setup() {
  const state = {
    rows: [{ ...resource, id, signals: {}, link_status: "ok", trust_status: "allowlisted" }] as Record<string, unknown>[],
    schemaError: false, resourceWriteError: false, resourceReadError: false, insertError: false, confirmationError: false,
    stored: undefined as undefined | { field_slug: string; skill_level: string; version: number }[],
  };
  let published: { field_slug: string; skill_level: string; version: number }[] = [];
  m.client.mockReturnValue({ from: (table: string) => {
    let mode = "", columns = "";
    const q = {
      select: (value: string) => { columns = value; return q; }, limit: () => q, in: () => q, eq: () => q,
      upsert: (rows: unknown, options: unknown) => { mode = "upsert"; m.upsert(rows, options); return q; },
      insert: (records: typeof published) => { mode = "insert"; published = records; m.insert(records); return q; },
      abortSignal: async () => {
        const error = { message: "private.example?token=private" };
        if (mode === "upsert") return { error: state.resourceWriteError ? error : null };
        if (mode === "insert") return { error: state.insertError ? error : null };
        if (table === "resources") return { data: state.rows, error: state.resourceReadError ? error : null };
        if (columns === "version") return { error: state.schemaError ? error : null };
        return { data: state.stored ?? published, error: state.confirmationError ? error : null };
      },
    }; return q;
  } });
  return state;
}
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, "info").mockImplementation(() => {}); m.blueprints.mockReturnValue([blueprint()]); m.inspect.mockResolvedValue({ status: "ok" }); });
afterEach(() => vi.restoreAllMocks());
it("keeps default validation read-only", async () => {
  expect(await publishRoadmapTemplates()).toMatchObject({ status: "validated", templates: 1 }); expect(m.client).not.toHaveBeenCalled();
});
it("publishes and confirms a complete valid version", async () => {
  setup(); const result = await publishRoadmapTemplates(true); expect(result).toMatchObject({ status: "published", templates: 1, verifiedResources: 1 });
  expect(m.insert).toHaveBeenCalledTimes(1); expect(m.insert.mock.calls[0][0][0].stages[0].resource_ids).toEqual([id]);
});
it("does not start verification or database work after the deadline", async () => {
  await expect(publishRoadmapTemplates(true, { verificationDeadline: Date.now() - 1 })).rejects.toMatchObject({ reason: "verification_deadline", publication: "not_started" });
  expect(m.inspect).not.toHaveBeenCalled(); expect(m.client).not.toHaveBeenCalled();
});
it("stops between batches without publishing a partially verified catalog", async () => {
  let now = Date.now(); vi.spyOn(Date, "now").mockImplementation(() => now);
  const value = blueprint(); value.stages[0].resources = Array.from({ length: 7 }, (_, index) => ({ ...resource, url: resource.url + index })); m.blueprints.mockReturnValue([value]);
  m.inspect.mockImplementation(async () => { now += 1000; return { status: "ok" }; });
  await expect(publishRoadmapTemplates(true, { verificationDeadline: now + 5000 })).rejects.toMatchObject({ reason: "verification_deadline", publication: "not_started" });
  expect(m.inspect).toHaveBeenCalledTimes(6); expect(m.client).not.toHaveBeenCalled();
});
it("rechecks the deadline after the final verification batch", async () => {
  let now = Date.now(); vi.spyOn(Date, "now").mockImplementation(() => now);
  m.inspect.mockImplementation(async () => { now += 6000; return { status: "ok" }; });
  await expect(publishRoadmapTemplates(true, { verificationDeadline: now + 5000 })).rejects.toMatchObject({ reason: "verification_deadline" }); expect(m.client).not.toHaveBeenCalled();
});
it.each(["unknown", "broken"])("refuses publication when a stage has only %s links", async status => {
  m.inspect.mockResolvedValue({ status }); await expect(publishRoadmapTemplates(true)).rejects.toMatchObject({ reason: "resource_coverage", publication: "not_started" }); expect(m.client).not.toHaveBeenCalled();
});
it.each([null, "", false, 10])("does not mistake unknown or paid price %s for free", async price => {
  const state = setup(); state.rows[0].price = price;
  await expect(publishRoadmapTemplates(true)).rejects.toMatchObject({ reason: "template_validation", publication: "not_started" }); expect(m.insert).not.toHaveBeenCalled();
});
it("validates curriculum structure before activating it", async () => {
  setup(); const value = blueprint(); value.stages[0].estimated_hours = -1; m.blueprints.mockReturnValue([value]);
  await expect(publishRoadmapTemplates(true)).rejects.toMatchObject({ reason: "template_validation", publication: "not_started" }); expect(m.insert).not.toHaveBeenCalled();
});
it("keeps unknown publication status after an insert error", async () => {
  const state = setup(); state.insertError = true;
  await expect(publishRoadmapTemplates(true)).rejects.toMatchObject({ reason: "template_write", publication: "unknown", version: expect.any(Number) });
});
it("does not claim old versions were retained when post-insert confirmation fails", async () => {
  const state = setup(); state.confirmationError = true;
  await expect(publishRoadmapTemplates(true)).rejects.toMatchObject({ reason: "publication_confirmation", publication: "unknown" }); expect(m.insert).toHaveBeenCalledTimes(1);
});
it("checks published identities, not just the number of records", async () => {
  const state = setup(); state.stored = [{ field_slug: "wrong-field", skill_level: "beginner", version: Math.floor(Date.now() / 1000) }];
  await expect(publishRoadmapTemplates(true)).rejects.toMatchObject({ reason: "publication_confirmation", publication: "unknown" });
});
it.each(["schemaError", "resourceWriteError", "resourceReadError"] as const)("sanitizes %s before publication", async key => {
  const state = setup(); state[key] = true;
  const error = await publishRoadmapTemplates(true).catch(value => value);
  expect(error).toBeInstanceOf(TemplatePublicationError); expect(error.publication).toBe("not_started"); expect(error.message).not.toMatch(/private.example|token=/); expect(m.insert).not.toHaveBeenCalled();
});
it("does not approve a different YouTube video", async () => {
  const value = blueprint(); value.stages[0].resources = [{ ...resource, platform: "youtube", url: "https://www.youtube.com/watch?v=requested" }]; m.blueprints.mockReturnValue([value]);
  m.videos.mockResolvedValue([{ videoId: "different" }]);
  await expect(publishRoadmapTemplates(true)).rejects.toMatchObject({ reason: "resource_coverage" }); expect(m.client).not.toHaveBeenCalled();
});
