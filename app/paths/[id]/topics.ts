"use server";
import {createClient} from "@/lib/supabase/server";
import {getLearningUser} from "@/lib/auth/learning-user";
import {requireUuid} from "@/lib/security/validation";
import {stageTopics} from "@/lib/paths/topics";
import {revalidatePath} from "next/cache";
export async function saveTopicCompletion(pathId:string,stageId:string,topicId:string,completed:boolean):Promise<{ok:boolean;error?:string}> {
 try {
 requireUuid(pathId);requireUuid(stageId);
 if(typeof completed!=="boolean" || typeof topicId!=="string")return {ok:false,error:"Invalid topic update."};
 const client=await createClient();const {data:{user}}=await getLearningUser(client);
 if(!user)return {ok:false,error:"Sign in again to save your topic progress."};
 const {data:stage,error:stageError}=await client.from("stages").select("id,title,description").eq("id",stageId).eq("path_id",pathId).maybeSingle();
 if(stageError || !stage || !stageTopics(stage.title,stage.description).some(t=>t.id===topicId))return {ok:false,error:"This learning topic is unavailable."};
 for(let attempt=0;attempt<3;attempt++) {
 const {data:existing,error:readError}=await client.from("stage_progress").select("practice_check").eq("stage_id",stageId).eq("user_id",user.id).maybeSingle();
 if(readError)return {ok:false,error:"Could not load your topic progress. Please retry."};
 const prior=existing?.practice_check ?? {};
 const practice_check={...prior,topic_completion:{...(prior.topic_completion??{}),[topicId]:completed}};
 if(!existing){
 const {error}=await client.from("stage_progress").insert({stage_id:stageId,user_id:user.id,status:"not_started",practice_check,updated_at:new Date().toISOString()}).select("stage_id").single();
 if(!error){revalidatePath("/paths/"+pathId);return {ok:true};}
 if(error.code==="23505")continue;
 return {ok:false,error:"Could not save your topic progress. Please retry."};
 }
 let query=client.from("stage_progress").update({practice_check,updated_at:new Date().toISOString()}).eq("stage_id",stageId).eq("user_id",user.id);
 // Compare the JSON document atomically so another tab's notes or ownership flags survive.
 query=existing.practice_check===null?query.is("practice_check",null):query.eq("practice_check",JSON.stringify(existing.practice_check));
 const {data:saved,error}=await query.select("stage_id").maybeSingle();
 if(error)return {ok:false,error:"Could not save your topic progress. Please retry."};
 if(saved){revalidatePath("/paths/"+pathId);return {ok:true};}
 }
 return {ok:false,error:"Your progress changed in another tab. Please retry."};
 }catch{return {ok:false,error:"Topic progress could not be saved. Please retry."};}
}
