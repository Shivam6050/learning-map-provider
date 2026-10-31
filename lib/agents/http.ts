import { authenticateAgent, type AgentAuthentication } from "./keys";
import { allowedBrowserOrigin, mcpHeaders } from "@/lib/mcp/http";
/** Only dedicated agent keys are accepted; browser cookies and Supabase JWTs cannot unlock tools. */
export async function authorizeAgentRequestWithIdentity(request: Request): Promise<{access: Extract<AgentAuthentication, {status:"authorized"}>; response?:never} | {access?:never; response:Response}> {
  const origin = allowedBrowserOrigin(request);
  if (origin === false) return {response:Response.json({error:"Origin not allowed"},{status:403,headers:{"Cache-Control":"no-store",Vary:"Origin"}})};
  const headers = mcpHeaders(origin);
  const authentication = await authenticateAgent(request);
  if (authentication.status === "authorized") return {access:authentication};
  if (authentication.status === "unavailable") return {response:Response.json({error:"Agent authentication is temporarily unavailable. Please retry shortly."},{status:503,headers})};
  headers.set("WWW-Authenticate", 'Bearer realm="LearningMap", error="invalid_token", error_description="Sign in to LearningMap and create an agent key in Settings."');
  return {response:Response.json({error:"An active agent key is required. Sign in and create one at /settings/agents."},{status:401,headers})};
}
export async function authorizeAgentRequest(request: Request): Promise<Response | null> {
  const result = await authorizeAgentRequestWithIdentity(request);
  return result.response ?? null;
}
export function agentResponseHeaders(request: Request) { return mcpHeaders(allowedBrowserOrigin(request) || null); }
export function agentPreflight(request: Request) {
  const origin = allowedBrowserOrigin(request);
  if (origin === false) return Response.json({error:"Origin not allowed"},{status:403,headers:{"Cache-Control":"no-store",Vary:"Origin"}});
  return new Response(null,{status:204,headers:mcpHeaders(origin)});
}
