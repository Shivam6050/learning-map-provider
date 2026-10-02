"use server";
import {createClient} from "@/lib/supabase/server";
import {getLearningUser} from "@/lib/auth/learning-user";
import {requireUuid} from "@/lib/security/validation";
import {courseLink} from "@/lib/affiliates/links";
import {revalidatePath} from "next/cache";
export async function saveResourceVisit(pathId:string,stageId:string,resourceId:string):Promise<{ok:boolean;error?:string}> {
 try {
 requireUuid(pathId);requireUuid(stageId);requireUuid(resourceId);
 const client=await createClient();const {data:{user}}=await getLearningUser(client);
 if(!user)return {ok:false,error:"Sign in again to sync your resource history."};
 const {data:stage,error:stageError}=await client.from("stages").select("id").eq("id",stageId).eq("path_id",pathId).maybeSingle();
 if(stageError||!stage)return {ok:false,error:"This stage is unavailable."};
 const {data:linked,error:linkError}=await client.from("stage_resources").select("resource_id, resources(url,link_status)").eq("stage_id",stageId).eq("resource_id",resourceId).maybeSingle();
 const resource=Array.isArray(linked?.resources)?linked.resources[0]:linked?.resources;
 if(linkError||!resource||resource.link_status==="broken"||!courseLink(resource.url).href)return {ok:false,error:"This resource is unavailable."};
 const openedAt=new Date().toISOString();
 for(let attempt=0;attempt<3;attempt++) {
 const {data:existing,error:readError}=await client.from("stage_progress").select("practice_check").eq("stage_id",stageId).eq("user_id",user.id).maybeSingle();
 if(readError)return {ok:false,error:"Could not load your learning progress. Please retry."};
 const prior=existing?.practice_check ?? {};
 // An earlier request must not replace a later visit after losing the document comparison.
 if(Date.parse(prior.resource_visit?.opened_at??"")>Date.parse(openedAt))return {ok:true};
 const practice_check={...prior,resource_visit:{resource_id:resourceId,opened_at:openedAt}};
 if(!existing){
 const {error}=await client.from("stage_progress").insert({stage_id:stageId,user_id:user.id,status:"not_started",practice_check,updated_at:new Date().toISOString()}).select("stage_id").single();
 if(!error){revalidatePath("/paths/"+pathId);return {ok:true};}
 if(error.code==="23505")continue;
 return {ok:false,error:"Could not save your learning progress. Please retry."};
 }
 let query=client.from("stage_progress").update({practice_check,updated_at:new Date().toISOString()}).eq("stage_id",stageId).eq("user_id",user.id);
 // Compare the JSON document atomically so another tab's notes or ownership flags survive.
 query=existing.practice_check===null?query.is("practice_check",null):query.eq("practice_check",JSON.stringify(existing.practice_check));
 const {data:saved,error}=await query.select("stage_id").maybeSingle();
 if(error)return {ok:false,error:"Could not save your learning progress. Please retry."};
 if(saved){revalidatePath("/paths/"+pathId);return {ok:true};}
 }
 return {ok:false,error:"Your progress changed in another tab. Please retry."};
 }catch{return {ok:false,error:"Your resource opened, but history could not sync. Please retry."};}
}
