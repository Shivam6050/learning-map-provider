import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {learningExport,type ExportPathRow,type ExportStageRow,type ExportProgressRow,type ExportResourceRow} from '@/lib/export/learning-data';
export class LearningExportError extends Error {constructor(public status:number,message:string){super(message);}}
type Page<T>={data:T[]|null;error:unknown;count:number|null};
/** Exact counts detect response caps and concurrent membership changes instead of returning partial files. */
export async function readExportRows<T>(fetchPage:(from:number,to:number)=>PromiseLike<Page<T>>,limit:number){
 const rows:T[]=[];let expected:number|undefined;
 do{
  const page=await fetchPage(rows.length,Math.min(rows.length+199,limit));
  if(page.error||page.count===null)throw new LearningExportError(503,'Could not read all your learning data. Please retry.');
  if(page.count>limit)throw new LearningExportError(413,'This export is too large. Download individual roadmaps instead.');
  if(expected!==undefined&&page.count!==expected)throw new LearningExportError(409,'Your roadmaps changed during export. Please retry.');
  expected=page.count;
  if(!page.data?.length&&rows.length<expected)throw new LearningExportError(503,'The export was incomplete. Please retry.');
  rows.push(...(page.data??[]));
 }while(rows.length<expected);
 if(rows.length!==expected)throw new LearningExportError(409,'Your roadmaps changed during export. Please retry.');
 return rows;
}
export async function loadLearningExport(client:SupabaseClient,userId:string,pathId?:string){
 const paths=await readExportRows<ExportPathRow>((from,to)=>{
  let query=client.from('learning_paths').select('id,skill_level,weekly_hours,budget_total,currency,created_at,fields(name)',{count:'exact'}).eq('user_id',userId);
  if(pathId)query=query.eq('id',pathId);
  return query.order('id').range(from,to).returns<ExportPathRow[]>();
 },100);
 if(pathId&&!paths.length)throw new LearningExportError(404,'Roadmap not found.');
 if(!paths.length)return learningExport([],[],[],[]);
 const stages=await readExportRows<ExportStageRow>((from,to)=>client.from('stages').select('id,path_id,order_index,title,description,estimated_hours',{count:'exact'}).in('path_id',paths.map(path=>path.id)).order('id').range(from,to),2000);
 const progress:ExportProgressRow[]=[],resources:ExportResourceRow[]=[];
 for(let offset=0;offset<stages.length;offset+=100){
  const ids=stages.slice(offset,offset+100).map(stage=>stage.id);
  const [saved,links]=await Promise.all([
   readExportRows<ExportProgressRow>((from,to)=>client.from('stage_progress').select('stage_id,status,completed_at,updated_at,practice_check',{count:'exact'}).eq('user_id',userId).in('stage_id',ids).order('stage_id').range(from,to),ids.length),
   readExportRows<ExportResourceRow>((from,to)=>client.from('stage_resources').select('stage_id,order_index,is_primary,resources(id,title,url,platform,resource_type)',{count:'exact'}).in('stage_id',ids).order('id').range(from,to).returns<ExportResourceRow[]>(),10000-resources.length),
  ]);
  progress.push(...saved);resources.push(...links);
 }
 return learningExport(paths,stages,progress,resources);
}
