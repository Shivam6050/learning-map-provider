import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ publish: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/templates/publish", async original => ({ ...await original<typeof import("@/lib/templates/publish")>(), publishRoadmapTemplates: m.publish }));
vi.mock("@/lib/monitoring/log-error", () => ({ logError: m.log }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
import { GET } from "./route";
import { TemplatePublicationError } from "@/lib/templates/publish";
const request = () => new Request("https://example.com/api/cron/refresh-templates", { headers: { authorization: "Bearer test" } });
beforeEach(() => { vi.stubEnv("CRON_SECRET", "test"); });
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });
it("rejects unsigned requests without publication", async () => { const response = await GET(new Request("https://example.com")); expect(response.status).toBe(401); expect(m.publish).not.toHaveBeenCalled(); expect(response.headers.get("cache-control")).toContain("no-store"); });
it("passes a bounded verification deadline and returns the confirmed version", async () => {
  m.publish.mockResolvedValue({ status: "published", version: 123, templates: 18 }); const start = Date.now(); const response = await GET(request());
  expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ version: 123 });
  expect(m.publish.mock.calls[0][1].verificationDeadline).toBeGreaterThanOrEqual(start + 30000); expect(m.publish.mock.calls[0][1].verificationDeadline).toBeLessThanOrEqual(Date.now() + 30000);
});
it("distinguishes stopped verification from uncertain activation", async () => {
  m.publish.mockRejectedValue(new TemplatePublicationError("verification_deadline", "not_started")); const response = await GET(request());
  expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ reason: "verification_deadline", publication: "not_started" });
});
it("reports a candidate version for an uncertain publication", async () => {
  m.publish.mockRejectedValue(new TemplatePublicationError("publication_confirmation", "unknown", 123)); const response = await GET(request());
  expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ version: 123, publication: "unknown" }); expect(response.headers.get("cache-control")).toContain("no-store");
});
it("sanitizes unexpected errors and never asserts publication did not happen", async () => {
  m.publish.mockRejectedValue(new Error("secret@example.com token=private")); const response = await GET(request()); const body = await response.json();
  expect(response.status).toBe(503); expect(body.publication).toBe("unknown"); expect(JSON.stringify(body)).not.toMatch(/secret@example|token=/); expect(String(m.log.mock.calls[0][1])).not.toMatch(/secret@example|token=/);
});
