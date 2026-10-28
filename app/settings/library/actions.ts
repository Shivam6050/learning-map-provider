'use server';
import {revalidatePath} from 'next/cache';
import {createClient} from '@/lib/supabase/server';
import {createServiceClient} from '@/lib/supabase/service';
import {getLearningUser} from '@/lib/auth/learning-user';
import {requireUuid} from '@/lib/security/validation';
import {validAccessDate} from '@/lib/learning-access';
import {isSafeHttpUrl} from '@/lib/link-check/url-safety';
export type AccessActionState={ok:boolean;message:string};
export async function saveLearningAccess(_previous:AccessActionState,form:FormData):Promise<AccessActionState>{
 let entryId:string|null,resourceId:string|null,subscription:string|null,version:string|null,expires:string|null;
 const kind=form.get('accessKind');
 try{
  if(kind!=='course'&&kind!=='subscription')throw new Error('kind');
  if(!form.get('entryId')&&form.get('confirmAccess')!=='on')throw new Error('confirmation');
  entryId=form.get('entryId')?requireUuid(String(form.get('entryId'))):null;
  resourceId=kind==='course'?requireUuid(String(form.get('resourceId'))):null;
  subscription=kind==='subscription'?'scrimba-pro':null;
  expires=String(form.get('expiresOn')??'')||null;
  if(expires&&!validAccessDate(expires)||kind==='subscription'&&!expires)throw new Error('date');
  version=entryId?String(form.get('version')??''):null;
  if(entryId&&(!version||version.length>40||!/^\d{4}-\d{2}-\d{2}T/.test(version)||!Number.isFinite(Date.parse(version))))throw new Error('version');
 }catch{return {ok:false,message:'Choose a course or Scrimba Pro and a valid access date. Subscriptions need a paid-through date.'};}
 const client=await createClient();const {data:{user}}=await getLearningUser(client,'/settings/library');
 if(!user)return {ok:false,message:'Sign in again before saving your library.'};
 try{
  if(entryId){
   const {data:entry,error}=await client.from('learning_access').select('resource_id,subscription_key').eq('id',entryId).eq('user_id',user.id).maybeSingle();
   if(error||!entry||entry.resource_id!==resourceId||entry.subscription_key!==subscription)return {ok:false,message:'This entry is unavailable. Refresh your library and retry.'};
  }else if(resourceId){
   const {data:course,error}=await client.from('resources').select('url,resource_type,trust_status,link_status').eq('id',resourceId).maybeSingle();
   if(error||!course||course.resource_type!=='course'||course.trust_status!=='allowlisted'||course.link_status==='broken'||!isSafeHttpUrl(course.url))return {ok:false,message:'Choose an available course from the catalog.'};
  }
  const {error}=await createServiceClient().rpc('save_learning_access',{p_user:user.id,p_id:entryId,p_resource:resourceId,p_subscription:subscription,p_expires:expires,p_active:entryId?form.get('active')==='on':true,p_version:version});
  if(error)return {ok:false,message:error.code==='23505'?'This access is already in your library. Update the existing entry below.':error.code==='54000'?'Your library can contain up to 200 entries.':error.code==='40001'?'This entry changed in another tab. Refresh before saving again.':'Your access could not be saved. Your form is still here; please retry.'};
 }catch{return {ok:false,message:'The library is temporarily unavailable. Please retry.'};}
 revalidatePath('/settings/library');revalidatePath('/paths','layout');
 return {ok:true,message:'Access saved. Roadmap estimates will use it while it covers your planned learning period.'};
}