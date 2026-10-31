import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { CATALOG_NOTICE, LEVELS, publicCatalog, publicResources, publicRoadmap } from "./catalog";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { createServiceClient } from "@/lib/supabase/service";
import type { AgentAuthentication, AgentScope } from "@/lib/agents/keys";

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const result = (value: Record<string, unknown>) => ({ content: [{type: "text" as const, text: JSON.stringify(value)}], structuredContent: value });
type AgentAccess = Extract<AgentAuthentication, {status:"authorized"}>;
const hasScope = (access:AgentAccess, scope:AgentScope) => access.scopes.includes(scope);
function relationOne<T>(value:T|T[]|null|undefined):T|null { return Array.isArray(value) ? value[0] ?? null : value ?? null; }
export function createLearningMapServer(access?:AgentAccess) {
  const server = new McpServer({ name: "learningmap", version: "1.1.0" }, { instructions: "Catalog previews are public authored data. Personal roadmap tools are restricted to the owner of the authenticated LearningMap agent key and only to its selected scopes. Never return notes, account details, purchases, or calendar data. " + CATALOG_NOTICE });
  server.registerTool("list_learning_fields", {
    description: "List the supported LearningMap fields and experience levels.", inputSchema: z.object({}).strict(), annotations,
  }, async () => result({ fields: FIELD_CATALOG.map(({slug,name}) => ({slug,name})), levels: LEVELS }));
  server.registerTool("get_curriculum_preview", {
    description: "Read an authored learning outline for a field and level, including projects, estimated effort and curated free resource references. Does not generate or save a personal roadmap.",
    inputSchema: z.object({ field: z.enum(FIELD_CATALOG.map(field => field.slug) as [string,...string[]]), level: z.enum(LEVELS) }).strict(), annotations,
  }, async ({field,level}) => result(publicRoadmap(field,level)!));
  server.registerTool("search_learning_resources", {
    description: "Search curated resources by title or topic. Free access is a catalog classification, not a live price guarantee; verify current provider terms.",
    inputSchema: z.object({ query: z.string().trim().min(2).max(100), limit: z.number().int().min(1).max(20).default(10) }).strict(), annotations,
  }, async ({query,limit}) => {
    const words = query.toLowerCase().split(/\s+/);
    const matches = publicResources.filter(resource => words.every(word => (resource.title + " " + resource.topics.join(" ")).toLowerCase().includes(word)));
    return result({ notice: CATALOG_NOTICE, total: matches.length, resources: matches.slice(0,limit) });
  });
  server.registerResource("learning-catalog", "learningmap://catalog", {title: "LearningMap public catalog", mimeType: "application/json", description: CATALOG_NOTICE}, async uri => ({contents: [{uri: uri.href, mimeType: "application/json", text: JSON.stringify(publicCatalog())}]}));
  if (access && hasScope(access,"personal:read")) {
    server.registerTool("list_my_roadmaps", {
      description: "List this signed-in account's saved roadmaps and completion counts. Only roadmaps owned by the verified key owner are returned; notes, budgets, and private account details are excluded.",
      inputSchema:z.object({}).strict(), annotations,
    }, async () => {
      const service=createServiceClient();
      const {data:paths,error:pathError}=await service.from("learning_paths").select("id,status,skill_level,created_at,fields(name)").eq("user_id",access.userId).order("created_at",{ascending:false}).limit(50);
      if(pathError) throw new Error("Could not read your roadmaps.");
      const ids=(paths??[]).map(path=>path.id);
      if(!ids.length) return result({roadmaps:[]});
      const {data:stages,error:stageError}=await service.from("stages").select("id,path_id").in("path_id",ids).order("order_index").limit(500);
      if(stageError) throw new Error("Could not read roadmap stages.");
      const stageIds=(stages??[]).map(stage=>stage.id);
      const {data:progress,error:progressError}=stageIds.length?await service.from("stage_progress").select("stage_id,status").eq("user_id",access.userId).in("stage_id",stageIds):{data:[],error:null};
      if(progressError) throw new Error("Could not read roadmap progress.");
      const byPath=new Map<string,{count:number;completed:number}>();
      for(const stage of stages??[]){const value=byPath.get(stage.path_id)??{count:0,completed:0};value.count++;byPath.set(stage.path_id,value);}
      const completed=new Set((progress??[]).filter(item=>item.status==="completed").map(item=>item.stage_id));
      for(const stage of stages??[]) if(completed.has(stage.id)){const value=byPath.get(stage.path_id);if(value)value.completed++;}
      return result({roadmaps:(paths??[]).map(path=>{const field=relationOne(path.fields);const counts=byPath.get(path.id)??{count:0,completed:0};return {id:path.id,field:field?.name??"Learning path",level:path.skill_level,status:path.status,createdAt:path.created_at,stageCount:counts.count,completedStages:counts.completed};})});
    });
    server.registerTool("get_my_roadmap_progress", {
      description: "Read ordered stage titles, estimates, and current completion status for one of your saved roadmaps. Does not include personal notes, resources, budget, or account data.",
      inputSchema:z.object({pathId:z.string().uuid()}).strict(), annotations,
    }, async ({pathId}) => {
      const service=createServiceClient();
      const {data:path,error:pathError}=await service.from("learning_paths").select("id,status,skill_level,fields(name)").eq("id",pathId).eq("user_id",access.userId).maybeSingle();
      if(pathError) throw new Error("Could not read this roadmap.");
      if(!path) return result({error:"Roadmap not found for this connection."});
      const {data:stages,error:stageError}=await service.from("stages").select("id,title,order_index,estimated_hours").eq("path_id",pathId).order("order_index").limit(500);
      if(stageError) throw new Error("Could not read roadmap stages.");
      const stageIds=(stages??[]).map(stage=>stage.id);
      const {data:progress,error:progressError}=stageIds.length?await service.from("stage_progress").select("stage_id,status,completed_at,updated_at").eq("user_id",access.userId).in("stage_id",stageIds):{data:[],error:null};
      if(progressError) throw new Error("Could not read roadmap progress.");
      const byStage=new Map((progress??[]).map(item=>[item.stage_id,item]));
      const field=relationOne(path.fields);
      return result({roadmap:{id:path.id,field:field?.name??"Learning path",level:path.skill_level,status:path.status,stages:(stages??[]).map(stage=>{const item=byStage.get(stage.id);return {id:stage.id,title:stage.title,order:stage.order_index,estimatedHours:stage.estimated_hours,status:item?.status??"not_started",completedAt:item?.completed_at??null,updatedAt:item?.updated_at??null};})}});
    });
  }
  if (access && hasScope(access,"progress:write") && hasScope(access,"personal:read")) {
    server.registerTool("update_my_stage_progress", {
      description: "Update the status of one stage in one of your saved roadmaps. This is a persistent change. Use only after the user explicitly asks to update that stage; never infer completion. Does not change notes or other roadmap data.",
      inputSchema:z.object({pathId:z.string().uuid(),stageId:z.string().uuid(),status:z.enum(["not_started","in_progress","completed"])}).strict(),
      annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false},
    }, async ({pathId,stageId,status}) => {
      const {data,error}=await createServiceClient().rpc("update_agent_stage_progress",{p_user:access.userId,p_path:pathId,p_stage:stageId,p_status:status});
      if(error) throw new Error("Could not update progress. Check that this stage belongs to one of your roadmaps.");
      return result({updated:true,pathId,stageId,status,updatedAt:data});
    });
  }
  return server;
}
