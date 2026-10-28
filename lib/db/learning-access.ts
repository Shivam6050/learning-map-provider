import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {LearningAccess} from '@/lib/learning-access';
export async function loadLearningAccess(client:SupabaseClient,userId:string):Promise<{entries:LearningAccess[];available:boolean}>{
 try{
  const {data,error}=await client.from('learning_access').select('id,access_type,resource_id,subscription_key,expires_on,active,updated_at,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(200);
  return {entries:error?[]:data??[],available:!error};
 }catch{return {entries:[],available:false};}
}