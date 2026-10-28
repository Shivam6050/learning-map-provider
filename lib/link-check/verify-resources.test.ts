import { afterEach, beforeEach, it, expect, vi } from "vitest";
const m = vi.hoisted(() => ({ inspect: vi.fn(), update: vi.fn(), write: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: () => ({ update: m.update }) }) }));
vi.mock("./check-url", () => ({ inspectUrl: m.inspect }));
vi.mock("@/lib/youtube/client", () => ({ getVideoStats: vi.fn() }));
import { verifyResourceLinks, LinkCheckPersistenceError } from "./verify-resources";
const resources = [{ id: "r", url: "https://example.com/course", platform: "docs" }];
const rows = [resources[0], { ...resources[0], id: "second" }, { ...resources[0], id: "third" }];
beforeEach(() => {
  vi.resetAllMocks();
  m.update.mockImplementation(() => ({ eq: (_column: string, id: string) => {
    const query = { select: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockReturnThis(), maybeSingle: () => m.write(id) }; return query;
  } }));
  m.write.mockImplementation(async (id: string) => ({ data: { id }, error: null }));
});
afterEach(() => vi.restoreAllMocks());
it("restores a recovered link", async () => {
  m.inspect.mockResolvedValue({ status: "ok" }); await verifyResourceLinks(resources);
  expect(m.update).toHaveBeenCalledWith({ link_status: "ok", link_checked_at: expect.any(String) });
});
it("preserves previous status on inconclusive checks", async () => {
  m.inspect.mockResolvedValue({ status: "unknown" }); const result = await verifyResourceLinks(resources);
  expect(m.update).toHaveBeenCalledWith({ link_checked_at: expect.any(String) }); expect(result[0].status).toBe("unknown");
});
it("reports persistence failures", async () => {
  m.inspect.mockResolvedValue({ status: "ok" }); m.write.mockResolvedValue({ error: { message: "private failure" }, data: null });
  await expect(verifyResourceLinks(resources)).rejects.toMatchObject({ name: "LinkCheckPersistenceError", results: [], failed: 1 });
});
it("does not count an update that affected no resource", async () => {
  m.inspect.mockResolvedValue({ status: "ok" }); m.write.mockResolvedValue({ error: null, data: null });
  await expect(verifyResourceLinks(resources)).rejects.toBeInstanceOf(LinkCheckPersistenceError);
});
it("only counts the resource identified by the write result", async () => {
  m.inspect.mockResolvedValue({ status: "ok" }); m.write.mockResolvedValue({ error: null, data: { id: "different" } });
  await expect(verifyResourceLinks(resources)).rejects.toMatchObject({ results: [], failed: 1 });
});
it("does not start new requests after the deadline", async () => {
  const result = await verifyResourceLinks(resources, 5, Date.now() - 1);
  expect(result).toEqual([]); expect(m.inspect).not.toHaveBeenCalled(); expect(m.update).not.toHaveBeenCalled();
});
it("retains previous-batch progress and stops scheduling after a write failure", async () => {
  m.inspect.mockResolvedValue({ status: "ok" });
  m.write.mockImplementation(async (id: string) => id === "second" ? { data: null, error: { message: "failed" } } : { data: { id }, error: null });
  await expect(verifyResourceLinks(rows, 1)).rejects.toMatchObject({ results: [{ id: "r", alive: true, status: "ok" }], failed: 1 });
  expect(m.inspect).toHaveBeenCalledTimes(2);
});
it("preserves confirmed writes when another write rejects", async () => {
  m.inspect.mockResolvedValue({ status: "broken" });
  m.write.mockImplementation(async (id: string) => { if (id === "second") throw new Error("private transport details"); return { data: { id }, error: null }; });
  await expect(verifyResourceLinks(rows, 3)).rejects.toMatchObject({ results: [{ id: "r", alive: false, status: "broken" }, { id: "third", alive: false, status: "broken" }], failed: 1 });
});
it("waits for in-flight writes before reporting partial failure", async () => {
  m.inspect.mockResolvedValue({ status: "ok" });
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  m.write.mockImplementation(async (id: string) => {
    if (id === "r") return { data: null, error: { message: "failed" } };
    await pending; return { data: { id }, error: null };
  });
  let settled = false;
  const outcome = verifyResourceLinks(rows.slice(0, 2), 2).catch(error => { settled = true; return error; });
  await vi.waitFor(() => expect(m.write).toHaveBeenCalledTimes(2));
  expect(settled).toBe(false); release();
  expect(await outcome).toMatchObject({ failed: 1, results: [{ id: "second", alive: true, status: "ok" }] });
});
