vi.mock("server-only",()=>({}));
import { expect, it, vi } from "vitest";
vi.mock("@/lib/agents/keys", () => ({authenticateAgent:vi.fn(async()=>({status:"authorized",userId:"owner"}))}));
import { GET as catalog } from "@/app/api/public/catalog/route";
import { GET as roadmap } from "@/app/api/public/roadmap/route";
import robots from "@/app/robots";
it("exposes an explicit public projection with no numeric price or account data", async () => {
  const response = await catalog(new Request("https://learningmap.example/api/public/catalog")); const data = await response.json();
  expect(data.fields).toHaveLength(6);
  expect(data.resources.length).toBeGreaterThan(0);
  for(const resource of data.resources) {
    expect(Object.keys(resource).sort()).toEqual(["access","priceVerifiedLive","title","topics","type","url"]);
    expect(new URL(resource.url).protocol).toBe("https:");
    expect(resource.priceVerifiedLive).toBe(false);
  }
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
});
it.each(["", "?field=invalid", "?field=backend-development&level=expert", "?field=backend-development&field=frontend-development", "?field=backend-development&level=beginner&level=advanced"])("rejects malformed public roadmap requests: %s", async query => {
  expect((await roadmap(new Request("https://learningmap.example/api/public/roadmap"+query))).status).toBe(400);
});
it("returns a public preview and keeps private pages out of crawler guidance",async () => {
  const response = await roadmap(new Request("https://learningmap.example/api/public/roadmap?field=backend-development"));
  expect(response.status).toBe(200);
  expect((await response.json()).level).toBe("beginner");
  expect(robots().rules).toMatchObject({disallow:expect.arrayContaining(["/paths/","/dashboard","/settings"]),allow:"/"});
});
