"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateAgentKey, hashAgentKey } from "@/lib/agents/keys";
import { requireUuid } from "@/lib/security/validation";
export type AgentKeyState = {error?:string; message?:string; key?:string};
export async function createAgentKey(_previous:AgentKeyState, form:FormData):Promise<AgentKeyState> {
  const client = await createClient();
  const {data:{user},error} = await client.auth.getUser().catch(()=>({data:{user:null},error:true}));
  if (error || !user || user.is_anonymous || !user.email_confirmed_at) return {error:"Sign in with a verified email before creating an agent key."};
  const label = String(form.get("label") ?? "").trim();
  if (!label || label.length > 80 || /[\u0000-\u001f\u007f]/.test(label)) return {error:"Use an agent name between 1 and 80 characters."};
  if (form.get("consent") !== "on") return {error:"Confirm the read-only access before creating your key."};
  const key = generateAgentKey();
  try {
    const result = await createServiceClient().rpc("create_agent_access_key",{p_user:user.id,p_label:label,p_hash:hashAgentKey(key)});
    if (result.error || !result.data) return {error:result.error?.code === "P0001" ? "You can have up to five active keys and create ten per day. Revoke an unused key or try tomorrow." : "Could not create your key. Please retry shortly."};
  } catch { return {error:"Could not create your key. Please retry shortly."}; }
  revalidatePath("/settings/agents");
  return {key,message:"Your key is ready. Copy it now; it will not be shown again. It expires in 30 days."};
}
export async function revokeAgentKey(_previous:AgentKeyState,form:FormData):Promise<AgentKeyState> {
  const client = await createClient();
  const {data:{user},error} = await client.auth.getUser().catch(()=>({data:{user:null},error:true}));
  if (error || !user) return {error:"Sign in again to revoke an agent key."};
  let id:string;
  try {id=requireUuid(String(form.get("keyId") ?? ""));} catch {return {error:"Choose a valid agent key."};}
  try {
    const result = await createServiceClient().from("agent_access_keys").update({revoked_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id).is("revoked_at",null).select("id");
    if (result.error) return {error:"Could not revoke this key. Please retry."};
    if (!result.data?.length) return {error:"This key is unavailable or already revoked."};
  } catch {return {error:"Could not revoke this key. Please retry."};}
  revalidatePath("/settings/agents");
  return {message:"Key revoked. The agent can no longer use it."};
}
