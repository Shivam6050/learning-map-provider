import { publicCatalog } from "@/lib/mcp/catalog";
import { authorizeAgentRequest, agentResponseHeaders, agentPreflight } from "@/lib/agents/http";
export const maxDuration = 30;
export async function GET(request:Request) {
  const denied=await authorizeAgentRequest(request); if(denied)return denied;
  return Response.json(publicCatalog(), {headers:agentResponseHeaders(request)});
}
export const OPTIONS=agentPreflight;
