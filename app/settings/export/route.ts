import {createClient} from '@/lib/supabase/server';
import {needsMfa} from '@/lib/auth/mfa';
import {requireUuid} from '@/lib/security/validation';
import {loadLearningExport,LearningExportError} from '@/lib/db/learning-export';
import {learningMarkdown} from '@/lib/export/learning-data';
const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
function failure(message:string,status:number){return Response.json({error:message},{status,headers:privateHeaders});}
export async function GET(request:Request){
 if(request.headers.get('sec-fetch-site')==='cross-site')return failure('Open exports from your LearningMap account.',403);
 const query=new URL(request.url).searchParams,format=query.get('format')??'json',pathId=query.get('path')??undefined;
 if(!['json','markdown'].includes(format))return failure('Choose JSON or Markdown.',400);
 if(pathId){try{requireUuid(pathId);}catch{return failure('Invalid roadmap.',400);}}
 try{
  // Return explicit status codes for the download UI instead of redirecting it to HTML.
  const client=await createClient({allowMfaChallenge:true});
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)return failure('Sign in again to download your learning data.',401);
  if(await needsMfa(client,user))return failure('Complete two-step verification before downloading your data.',403);
  const data=await loadLearningExport(client,user.id,pathId);
  const body=format==='json'?JSON.stringify(data,null,2):learningMarkdown(data);
  if(new TextEncoder().encode(body).length>3_000_000)return failure('This export is too large. Download individual roadmaps instead.',413);
  return new Response(body,{headers:{...privateHeaders,'Content-Type':format==='json'?'application/json; charset=utf-8':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="learningmap-${pathId?'roadmap':'learning-data'}-${data.exported_at.slice(0,10)}.${format==='json'?'json':'md'}"`}});
 }catch(error){return error instanceof LearningExportError?failure(error.message,error.status):failure('Your download could not be prepared. Please retry.',503);}
}
