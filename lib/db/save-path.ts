import { createHash } from "node:crypto";
import type { PathOption } from "@/lib/ai/build-options";

export function stableSaveId(value: string) {
  const chars = createHash("sha256").update("learningmap-save-v1:" + value).digest("hex").slice(0,32).split("");
  chars[12] = "8"; chars[16] = "a";
  const h = chars.join("");
  return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join("-");
}

type WriteResult = { error: { message: string; code?: string } | null; status?: number };
export async function retryPathWrite(write: () => PromiseLike<WriteResult>, pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await write();
      if (!result.error) return;
      const transient = [408,429,500,502,503,504].includes(result.status ?? 0) || /timeout|timed out|fetch failed|connection|temporarily|gateway/i.test(result.error.message);
      if (!transient || attempt === 2) throw new Error(result.error.message);
    } catch (error) {
      if (attempt === 2 || !(error instanceof Error) || !/timeout|timed out|fetch failed|connection|temporarily|gateway|abort/i.test(error.message)) throw error;
    }
    await pause(250 * (attempt + 1));
  }
}

/** Fixed IDs and ignoreDuplicates allow an uncertain committed write to be retried safely. */
export async function savePath(service: any, userId: string, setId: string, pathSet: any, option: PathOption) {
  const identity = JSON.stringify([userId,setId,option.id,option.stages.map(stage => [stage.order_index,stage.stage_resources.map(r=>r.resource_id).sort()])]);
  const id = stableSaveId(identity);
  const stages = option.stages.map(stage => ({ id: stableSaveId(id + ":stage:" + stage.order_index), path_id: id, title: stage.title, order_index: stage.order_index, description: stage.description, estimated_hours: stage.estimated_hours }));
  await retryPathWrite(() => service.from("learning_paths").upsert({ id, user_id:userId, field_id:pathSet.field_id, skill_level:pathSet.skill_level, weekly_hours:pathSet.weekly_hours, budget_total:pathSet.budget_total, currency:pathSet.currency, status:"active" }, {onConflict:"id",ignoreDuplicates:true}));
  if (stages.length) await retryPathWrite(() => service.from("stages").upsert(stages,{onConflict:"id",ignoreDuplicates:true}));
  const links = option.stages.flatMap((stage,i) => stage.stage_resources.map(sr=>({stage_id:stages[i].id,resource_id:sr.resource_id,order_index:sr.order_index,is_primary:sr.is_primary})));
  if (links.length) await retryPathWrite(() => service.from("stage_resources").upsert(links,{onConflict:"stage_id,resource_id",ignoreDuplicates:true}));
  const progress = option.stages.map((stage,i) => ({stage_id:stages[i].id,user_id:userId,status:"not_started",practice_check:stage.practice_check ? {description:stage.practice_check} : {}}));
  if (progress.length) await retryPathWrite(() => service.from("stage_progress").upsert(progress,{onConflict:"stage_id,user_id",ignoreDuplicates:true}));
  return id;
}
