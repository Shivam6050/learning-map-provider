"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getLearningUser } from "@/lib/auth/learning-user";
import { requireUuid } from "@/lib/security/validation";
import type { ResourceActionState } from "@/lib/paths/resource-management";
export async function reviewResourceReport(_previous: ResourceActionState,form: FormData): Promise<ResourceActionState> {
 let id:string;try{id=requireUuid(String(form.get("reportId")));}catch{return {ok:false,message:"Invalid report."};}
 const version=String(form.get("expectedReviewedAt")??"");
 if(version && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(version)||!Number.isFinite(Date.parse(version))))return {ok:false,message:"Refresh the report before reviewing it."};
 const status=String(form.get("status")),expected=String(form.get("expectedStatus")),resolution=form.get("resolution");
 if(!["reviewing","resolved","dismissed"].includes(status)||!["open","reviewing","resolved","dismissed"].includes(expected)||typeof resolution!=="string"||resolution.trim().length>500)return {ok:false,message:"Choose a review status and keep your note within 500 characters."};
 const client=await createClient();const {data:{user}}=await getLearningUser(client);
 if(!user)return {ok:false,message:"Sign in again to review reports."};
 const {data:profile,error}=await client.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(error||profile?.role!=="admin")return {ok:false,message:"You are not authorized to review reports."};
 try{
  const {error}=await createServiceClient().rpc("review_resource_report",{p_user:user.id,p_report:id,p_expected:expected,p_status:status,p_resolution:resolution.trim(),p_reviewed_at:version||null});
  if(error)return {ok:false,message:"The report changed or could not be saved. Refresh the queue before retrying."};
 }catch{return {ok:false,message:"Reviewing is temporarily unavailable. Please retry."};}
 revalidatePath("/admin/resource-reports");
 return {ok:true,message:"Review saved. Public course prices and availability were not changed."};
}
