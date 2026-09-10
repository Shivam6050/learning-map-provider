import { afterEach, describe, expect, it, vi } from "vitest";
import { checkUrlAlive, inspectUrl } from "./check-url";
afterEach(() => vi.restoreAllMocks());
describe("resource verification", () => {
  it("rejects deleted pages", async () => { vi.spyOn(global, "fetch").mockResolvedValue(new Response("", {status:404})); expect(await checkUrlAlive("https://example.com/course/a")).toBe(false); });
  it("does not mark timeouts alive or broken", async () => { vi.spyOn(global,"fetch").mockRejectedValue(new Error("timeout")); expect((await inspectUrl("https://example.com/a")).status).toBe("unknown"); });
  it("rejects soft 404 pages", async () => { vi.spyOn(global,"fetch").mockResolvedValue(new Response("<title>Course not found</title>")); expect(await checkUrlAlive("https://example.com/a")).toBe(false); });
  it("rejects redirects to private addresses before fetching them", async () => { const fetcher=vi.spyOn(global,"fetch").mockResolvedValue(new Response(null,{status:302,headers:{location:"http://127.0.0.1/admin"}})); expect(await checkUrlAlive("https://example.com/a")).toBe(false); expect(fetcher).toHaveBeenCalledTimes(1); });
  it("accepts an available course", async () => { vi.spyOn(global,"fetch").mockResolvedValue(new Response("<title>Learn CSS</title>")); expect(await checkUrlAlive("https://example.com/course/css")).toBe(true); });
  it("does not confuse rate limiting with deletion", async () => { vi.spyOn(global,"fetch").mockResolvedValue(new Response("",{status:429})); expect((await inspectUrl("https://example.com/a")).status).toBe("unknown"); });
});
