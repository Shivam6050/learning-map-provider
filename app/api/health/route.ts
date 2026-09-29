import { createServiceClient } from "@/lib/supabase/service";
export const dynamic="force-dynamic";
export async function GET() {
 try {
  const {error}=await createServiceClient().from("fields").select("id").limit(1).abortSignal(AbortSignal.timeout(3000));
  if(error)throw error;
  return Response.json({status:"ok",database:"reachable"},{headers:{"Cache-Control":"no-store"}});
 } catch {
  return Response.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
