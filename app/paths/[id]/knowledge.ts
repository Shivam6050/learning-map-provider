"use server";
import {unstable_rethrow} from "next/navigation";
import {createClient} from '@/lib/supabase/server';
import {getLearningUser} from '@/lib/auth/learning-user';
import {requireUuid} from '@/lib/security/validation';
import {stageQuestions,publicQuiz,gradeKnowledge} from '@/lib/assessment/stage-knowledge-bank';
import type {CurriculumRef} from '@/lib/paths/authored-curriculum';
import type {KnowledgeResponse} from '@/lib/paths/knowledge-types';
async function questionsForOwner(pathId:string,stageId:string){
 requireUuid(pathId);requireUuid(stageId);
 const client=await createClient();const {data:{user}}=await getLearningUser(client,'/paths/'+pathId);
 if(!user)throw new Error('Unavailable');
 const {data:path,error:pathError}=await client.from('learning_paths').select('id').eq('id',pathId).eq('user_id',user.id).maybeSingle();
 if(pathError||!path)throw new Error('Unavailable');
 const [stageResult,progressResult]=await Promise.all([
  client.from('stages').select('title,description').eq('id',stageId).eq('path_id',pathId).maybeSingle(),
  client.from('stage_progress').select('practice_check').eq('stage_id',stageId).eq('user_id',user.id).maybeSingle(),
 ]);
 if(stageResult.error||!stageResult.data||progressResult.error)throw new Error('Unavailable');
 const raw=progressResult.data?.practice_check?.curriculum_ref;
 // A missing authored version must not silently become a different assessment.
 if(raw!==undefined&&(!raw||typeof raw.id!=='string'||!Number.isInteger(raw.version)))return [];
 const reference=raw as CurriculumRef|undefined;
 return stageQuestions(stageResult.data.title,stageResult.data.description,reference);
}
export async function loadStageKnowledge(pathId:string,stageId:string):Promise<KnowledgeResponse>{
 try{const questions=await questionsForOwner(pathId,stageId);return questions.length?{ok:true,message:'Answer each question, then review the explanations.',quiz:publicQuiz(questions)}:{ok:false,message:'No authored check is available for this stage’s saved curriculum. Your projects and completion controls are still available.'};}
 catch(error){unstable_rethrow(error);return {ok:false,message:'This check could not be loaded. Confirm you are signed in and retry.'};}
}
export async function submitStageKnowledge(pathId:string,stageId:string,version:string,answers:unknown):Promise<KnowledgeResponse>{
 if(typeof version!=='string'||version.length>500||!Array.isArray(answers)||answers.length>4)return {ok:false,message:'Reload the check and answer every question.'};
 try{
  const questions=await questionsForOwner(pathId,stageId);
  try{return {ok:true,message:'Your answers have been checked.',result:gradeKnowledge(questions,version,answers)};}
  catch{return {ok:false,message:'This check changed or some answers are missing. Reload it and try again.'};}
 }catch(error){unstable_rethrow(error);return {ok:false,message:'Your answers could not be checked. Confirm you are signed in and retry.'};}
}
