import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

export function generateAgentKey() { return "lm_agent_" + randomBytes(32).toString("base64url"); }
export function hashAgentKey(key: string) { return createHash("sha256").update(key).digest("hex"); }
export function readAgentKey(request: Request) {
  const match = /^Bearer (lm_agent_[A-Za-z0-9_-]{43})$/i.exec(request.headers.get("authorization") ?? "");
  return match?.[1] ?? null;
}
export type AgentAuthentication = {status: "authorized"; userId: string} | {status: "unauthorized" | "unavailable"};
export async function authenticateAgent(request: Request): Promise<AgentAuthentication> {
  const key = readAgentKey(request);
  if (!key) return {status: "unauthorized"};
  try {
    const service = createServiceClient();
    const {data, error} = await service.from("agent_access_keys").select("user_id, scope, expires_at, revoked_at").eq("token_hash",hashAgentKey(key)).maybeSingle();
    if (error) return {status: "unavailable"};
    if (!data || data.scope !== "catalog:read" || data.revoked_at || !Number.isFinite(Date.parse(data.expires_at)) || Date.parse(data.expires_at) <= Date.now()) return {status: "unauthorized"};
    // Deleted accounts cascade their keys; also reject blocked/unverified identities.
    const identity = await service.auth.admin.getUserById(data.user_id);
    if (identity.error) return {status: identity.error.status === 404 ? "unauthorized" : "unavailable"};
    const user = identity.data.user as (typeof identity.data.user & {banned_until?: string});
    if (!user || user.id !== data.user_id || user.is_anonymous || !user.email_confirmed_at || (user.banned_until && Date.parse(user.banned_until) > Date.now())) return {status: "unauthorized"};
    return {status: "authorized", userId: user.id};
  } catch { return {status: "unavailable"}; }
}

export async function listOwnerAgentKeys(client:SupabaseClient, userId:string) {
  const {data,error}=await client.from("agent_access_keys").select("id,label,scope,created_at,expires_at,revoked_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(50);
  const now=Date.now();
  return {error,keys:data?.map(key=>({...key,active:!key.revoked_at && Date.parse(key.expires_at)>now}))};
}
