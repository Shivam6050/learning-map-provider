import { createMcpHandler } from "@modelcontextprotocol/server";
import { createLearningMapServer } from "@/lib/mcp/server";
import { allowedBrowserOrigin, mcpHeaders } from "@/lib/mcp/http";

export const runtime = "nodejs";
export const maxDuration = 15;
const handler = createMcpHandler(createLearningMapServer, { legacy: "stateless", responseMode: "json", maxRequestBodySize: 16384, maxSubscriptions: 0 });
async function handle(request: Request) {
  const origin = allowedBrowserOrigin(request);
  if (origin === false) return Response.json({error: "Origin not allowed"}, {status: 403, headers: {"Cache-Control": "no-store", "Vary": "Origin"}});
  const headers = mcpHeaders(origin);
  if (request.method === "OPTIONS") return new Response(null, {status: 204, headers});
  try {
    const response = await handler.fetch(request);
    headers.forEach((value,key) => response.headers.set(key,value));
    return response;
  } catch {
    return Response.json({jsonrpc: "2.0", id: null, error: {code: -32603, message: "MCP request failed"}}, {status: 500, headers});
  }
}
export const POST = handle;
export const GET = handle;
export const DELETE = handle;
export const OPTIONS = handle;
