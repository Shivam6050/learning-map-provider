
export type LearningAccess = {
 id:string; access_type:'course'|'subscription'; resource_id:string|null;
 subscription_key:'scrimba-pro'|null; expires_on:string|null; active:boolean;
 updated_at:string; created_at:string;
};
type AccessResource={id:string;url:string;signals?:Record<string,unknown>};
// Only the reviewed paid catalog modules are covered by this subscription.
export const SCRIMBA_PRO_MODULES = new Set([
 'https://scrimba.com/the-backend-developer-path-c0tbi0l98f',
 'https://scrimba.com/fullstack-path-c0fullstack',
 'https://scrimba.com/advanced-react-c02h',
]);
export function isProModule(url:string) {
 try{const parsed=new URL(url);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password&&!parsed.port&&SCRIMBA_PRO_MODULES.has(parsed.origin+parsed.pathname.replace(/\/$/,''));}catch{return false;}
}
export function validAccessDate(value:string) {
 if(!/^20\d{2}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function accessStatus(entry:LearningAccess,today=new Date().toISOString().slice(0,10)) {
 return !entry.active?'paused':entry.expires_on&&entry.expires_on<today?'expired':'active';
}
export function coversResource(entry:LearningAccess,resource:AccessResource,through:string) {
 if(!entry.active||entry.expires_on&&entry.expires_on<through)return false;
 if(entry.access_type==='course')return entry.resource_id===resource.id;
 return entry.subscription_key==='scrimba-pro'&&entry.expires_on!==null&&isProModule(resource.url);
}
/** Discount only access lasting through the last planned use, never merely active today. */
export function libraryOwnedIds(stages:{estimated_hours:number;stage_resources:{resources:AccessResource}[];stage_progress?:{status:string}[]}[],entries:LearningAccess[],weeklyHours:number,now=new Date()) {
 let hours=0;
 const lastUse=new Map<string,{resource:AccessResource;through:string}>();
 for(const stage of stages){
  if(stage.stage_progress?.[0]?.status!=='completed')hours+=Math.max(0,stage.estimated_hours);
  const date=new Date(now);date.setUTCDate(date.getUTCDate()+Math.ceil(hours/Math.max(1,weeklyHours)*7));
  const through=date.toISOString().slice(0,10);
  for(const {resources} of stage.stage_resources)if(resources)lastUse.set(resources.id,{resource:resources,through});
 }
 return new Set([...lastUse.values()].filter(({resource,through})=>entries.some(entry=>coversResource(entry,resource,through))).map(({resource})=>resource.id));
}