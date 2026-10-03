import { publicRoadmap, LEVELS } from "@/lib/mcp/catalog";
import { getFieldBySlug } from "@/lib/fields/catalog";
import { authorizeAgentRequest, agentResponseHeaders, agentPreflight } from "@/lib/agents/http";
export const maxDuration = 30;
export async function GET(request: Request) {
  const denied=await authorizeAgentRequest(request); if(denied)return denied;
  const headers=agentResponseHeaders(request);
  const params = new URL(request.url).searchParams;
  const field = params.get("field") ?? "";
  const level = params.get("level") ?? "beginner";
  if (params.getAll("field").length !== 1 || params.getAll("level").length > 1 || !getFieldBySlug(field) || !LEVELS.some(value => value === level)) {
    return Response.json({error: "Provide one supported field slug and level (beginner, intermediate, advanced)."}, {status: 400, headers: headers});
  }
  return Response.json(publicRoadmap(field,level), {headers: headers});
}

export const OPTIONS=agentPreflight;
