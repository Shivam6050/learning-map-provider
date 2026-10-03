import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { POST, GET, OPTIONS } from "./route";
const url = "https://learningmap.example/mcp";
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://learningmap.example"); vi.stubEnv("MCP_ALLOWED_ORIGINS", ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function rpc(method: string, params: Record<string, unknown> = {}, headers: Record<string,string> = {}) {
  return POST(new Request(url,{method:"POST", headers:{"Content-Type":"application/json",Accept:"application/json, text/event-stream",...headers},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})}));
}
async function body(response: Response) {
  const text = await response.text();
  return JSON.parse(text.startsWith("event:") || text.startsWith("data:") ? text.split("\n").find(line => line.startsWith("data: "))!.slice(6) : text);
}
it("completes legacy MCP initialization and exposes only public read-only tools", async () => {
  const initialized = await body(await rpc("initialize",{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"audit",version:"1"}}));
  expect(initialized.result.serverInfo.name).toBe("learningmap");
  const discovered = await body(await rpc("tools/list"));
  expect(discovered.result.tools.map((tool:{name:string}) => tool.name).sort()).toEqual(["get_curriculum_preview","list_learning_fields","search_learning_resources"]);
  for (const tool of discovered.result.tools) expect(tool.annotations.readOnlyHint).toBe(true);
});
it("serves all eighteen curricula without any upstream request", async () => {
  const network = vi.fn(() => { throw new Error("Unexpected network access"); }); vi.stubGlobal("fetch",network);
  const fields = await body(await rpc("tools/call",{name:"list_learning_fields",arguments:{}}));
  for (const field of fields.result.structuredContent.fields) for (const level of ["beginner","intermediate","advanced"]) {
    const result = await body(await rpc("tools/call",{name:"get_curriculum_preview",arguments:{field:field.slug,level}}));
    expect(result.result.isError).not.toBe(true);
    expect(result.result.structuredContent.stages.length).toBeGreaterThanOrEqual(4);
    expect(result.result.structuredContent.estimatedHours).toBeGreaterThan(0);
    expect(result.result.structuredContent.notice).toContain("not a saved");
  }
  expect(network).not.toHaveBeenCalled();
});
it("works with the current official MCP client", async () => {
  const client = new Client({name:"learningmap-test",version:"1"});
  const transport = new StreamableHTTPClientTransport(new URL(url), {fetch: async (input,init) => {
    const request = new Request(input,init);
    return request.method === "POST" ? POST(request) : GET(request);
  }});
  try {
    await client.connect(transport);
    const tools = await client.listTools(); expect(tools.tools).toHaveLength(3);
    const result = await client.callTool({name:"search_learning_resources",arguments:{query:"react",limit:2}});
    expect(result.isError).not.toBe(true);
    expect((result.structuredContent as {resources:unknown[]}).resources.length).toBeLessThanOrEqual(2);
    const resources = await client.readResource({uri:"learningmap://catalog"});
    expect(JSON.parse((resources.contents[0] as {text:string}).text).fields).toHaveLength(6);
  } finally { await client.close(); }
});
it.each([
  {name:"get_curriculum_preview",arguments:{field:"../../private",level:"beginner"}},
  {name:"get_curriculum_preview",arguments:{field:"backend-development",level:"expert"}},
  {name:"search_learning_resources",arguments:{query:"react",limit:1000}},
  {name:"search_learning_resources",arguments:{query:"x".repeat(101)}},
  {name:"search_learning_resources",arguments:{query:"react",user_id:"someone"}},
  {name:"delete_account",arguments:{}},
])("rejects invalid input or private tools: %j", async params => {
  const result = await body(await rpc("tools/call",params));
  expect(Boolean(result.error || result.result?.isError)).toBe(true);
});
it("rejects unknown origins before processing and accepts configured exact origins", async () => {
  expect((await rpc("tools/list",{}, {Origin:"https://evil.example"})).status).toBe(403);
  vi.stubEnv("MCP_ALLOWED_ORIGINS","https://assistant.example");
  const allowed = await rpc("tools/list",{}, {Origin:"https://assistant.example"});
  expect(allowed.status).toBe(200);
  expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe("https://assistant.example");
  expect(allowed.headers.has("Access-Control-Allow-Credentials")).toBe(false);
  expect(allowed.headers.has("set-cookie")).toBe(false);
  expect((await rpc("tools/list",{}, {Origin:"https://assistant.example.evil.test"})).status).toBe(403);
});
it("supports preflight and bounds request bodies even without Content-Length", async () => {
  expect((await OPTIONS(new Request(url,{method:"OPTIONS",headers:{Origin:"https://learningmap.example"}}))).status).toBe(204);
  const large = await POST(new Request(url,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json, text/event-stream"},body:" ".repeat(17000)}));
  expect(large.status).toBe(413);
});
it("rejects malformed JSON and does not expose details", async () => {
  const response = await POST(new Request(url,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json, text/event-stream"},body:"{"}));
  expect(response.status).toBe(400);
  expect(await response.text()).not.toContain("node_modules");
});

it("redirects ordinary browser visits to the connection guide without caching", async () => {
  const response = await GET(new Request(url,{headers:{Accept:"text/html,application/xhtml+xml,*/*;q=0.8"}}));
  expect(response.status).toBe(307);
  expect(response.headers.get("Location")).toBe("/integrations");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("Vary")).toContain("Accept");
});
it.each([{}, {Accept:"text/event-stream"}, {Accept:"application/json"}, {Accept:"text/html", "MCP-Protocol-Version":"2025-11-25"}])("preserves the stateless MCP GET response for protocol clients: %j", async headers => {
  const response = await GET(new Request(url,{headers:headers as Record<string,string>}));
  expect(response.status).toBe(405);
  expect(response.headers.has("Location")).toBe(false);
});
it("still checks browser origins before redirecting to the guide", async () => {
  expect((await GET(new Request(url,{headers:{Accept:"text/html",Origin:"https://evil.example"}}))).status).toBe(403);
});
