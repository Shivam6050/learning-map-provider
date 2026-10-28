import {stageTopics} from '@/lib/paths/topics';
import {projectMilestones} from '@/lib/paths/milestones';
import {curriculumUnit,type CurriculumRef} from '@/lib/paths/authored-curriculum';
import {isSafeHttpUrl} from '@/lib/link-check/url-safety';
export type ExportPathRow={id:string;skill_level:string;weekly_hours:number;budget_total:number|string;currency:string;created_at:string;fields:{name:string}|{name:string}[]|null};
export type ExportStageRow={id:string;path_id:string;order_index:number;title:string;description:string|null;estimated_hours:number};
export type ExportProgressRow={stage_id:string;status:string;completed_at:string|null;updated_at:string|null;practice_check:unknown};
export type ExportResourceRow={stage_id:string;order_index:number;is_primary:boolean;resources:{id:string;title:string;url:string;platform:string|null;resource_type:string}|{id:string;title:string;url:string;platform:string|null;resource_type:string}[]|null};
const record=(value:unknown):Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
const text=(value:unknown)=>typeof value==='string'?value:null;
function checks(definitions:{id:string;title:string;criterion:string}[],saved:unknown){
 const values=record(saved);
 return [...definitions.map(item=>({...item,completed:values[item.id]===true})),...Object.entries(values).filter(([id,value])=>typeof value==='boolean'&&!definitions.some(item=>item.id===id)).map(([id,value])=>({id,title:id,criterion:'Saved check from an earlier curriculum version.',completed:value===true}))];
}
export function learningExport(paths:ExportPathRow[],stages:ExportStageRow[],progress:ExportProgressRow[],resources:ExportResourceRow[],generatedAt=new Date().toISOString()){
 const byStage=new Map(progress.map(row=>[row.stage_id,row]));
 return {schema_version:1,exported_at:generatedAt,product:'LearningMap',notice:'Personal learning snapshot. Completion and course ownership are self-reported. This is not a certificate, purchase receipt or live course-price quote.',roadmaps:paths.map(path=>{
  const field=Array.isArray(path.fields)?path.fields[0]:path.fields;
  return {id:path.id,title:field?.name??'Learning path',skill_level:path.skill_level,weekly_hours:path.weekly_hours,budget_total:Number(path.budget_total),currency:path.currency,created_at:path.created_at,stages:stages.filter(stage=>stage.path_id===path.id).sort((a,b)=>a.order_index-b.order_index||a.id.localeCompare(b.id)).map(stage=>{
   const saved=byStage.get(stage.id),practice=record(saved?.practice_check),rawRef=record(practice.curriculum_ref);
   const reference:CurriculumRef|undefined=typeof rawRef.id==='string'&&typeof rawRef.version==='number'?{id:rawRef.id,version:rawRef.version}:undefined;
   const owned=Array.isArray(practice.owned_resource_ids)?practice.owned_resource_ids.filter((id):id is string=>typeof id==='string'&&/^[0-9a-f-]{36}$/i.test(id)):[];
   return {id:stage.id,position:stage.order_index,title:stage.title,description:stage.description,estimated_hours:stage.estimated_hours,status:saved?.status??'not_started',completed_at:saved?.completed_at??null,updated_at:saved?.updated_at??null,curriculum_reference:reference??null,practice_prompt:text(practice.description),notes:text(practice.user_submission),notes_saved_at:text(practice.submitted_at),project_brief:curriculumUnit(stage.title,reference)?.project??null,topics:checks(stageTopics(stage.title,stage.description,reference),practice.topic_completion),project_milestones:checks(projectMilestones(stage.title,stage.description,reference),practice.milestone_completion),confirmed_owned_resource_ids:owned,resources:resources.filter(row=>row.stage_id===stage.id).sort((a,b)=>a.order_index-b.order_index).map(row=>{
    const resource=Array.isArray(row.resources)?row.resources[0]:row.resources;
    return resource?{id:resource.id,title:resource.title,url:isSafeHttpUrl(resource.url)?resource.url:null,platform:resource.platform,type:resource.resource_type,primary:row.is_primary}:null;
   }).filter(row=>row!==null)};
  })};
 })};
}
export type LearningExport=ReturnType<typeof learningExport>;
// Escape authored and learner text so Markdown viewers cannot execute raw HTML or inject links.
export const markdownText=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/([\\`*_{}\[\]()#+.!|~-])/g,'\\$1');
export function learningMarkdown(data:LearningExport){
 const lines=['# LearningMap — your learning record','',`Exported: ${data.exported_at}`,'',data.notice,''];
 for(const path of data.roadmaps){
  lines.push(`## ${markdownText(path.title)}`,'',`${markdownText(path.skill_level)} · ${path.weekly_hours} hours/week · Budget: ${path.budget_total} ${markdownText(path.currency)}`,'');
  for(const [index,stage] of path.stages.entries()){
   lines.push(`### ${index+1}. ${markdownText(stage.title)}`,'',`Status: ${markdownText(stage.status)} · ${stage.estimated_hours} estimated hours`,'');
   if(stage.completed_at)lines.push(`Completed: ${markdownText(stage.completed_at)}`,'');
   for(const [label,value] of [['Overview',stage.description],['Practice task',stage.practice_prompt],['Project brief',stage.project_brief],['Your notes',stage.notes]])if(value)lines.push(`#### ${label}`,'',...markdownText(value).split(/\r?\n/).map(line=>'> '+line),'');
   for(const [label,items] of [['Topics',stage.topics],['Project milestones',stage.project_milestones]] as const){
    lines.push(`#### ${label}`,'');for(const item of items)lines.push(`- [${item.completed?'x':' '}] ${markdownText(item.title)} — ${markdownText(item.criterion)}`);lines.push('');
   }
   lines.push('#### Resources','');for(const resource of stage.resources){lines.push(`- ${markdownText(resource.title)}${resource.primary?' (primary)':''}${resource.platform?' — '+markdownText(resource.platform):''}`);if(resource.url)lines.push(`  ${markdownText(resource.url)}`);}lines.push('');
  }
 }
 if(!data.roadmaps.length)lines.push('No saved roadmaps yet.','');
 return lines.join('\n');
}
