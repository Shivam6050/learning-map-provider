import { createHash } from "node:crypto";
import type { PathOption } from "@/lib/ai/build-options";

export function stableSaveId(value: string) {
  const chars = createHash("sha256").update("learningmap-save-v1:" + value).digest("hex").slice(0,32).split("");
  chars[12] = "8"; chars[16] = "a";
  const h = chars.join("");
  return [h.slice(0,8),h.slice(8,12),h.slice(12,16),h.slice(16,20),h.slice(20)].join("-");
}

/** Keep identical to the transaction identity so retries find the committed path. */
export function pathSaveId(userId: string, setId: string, option: PathOption) {
  return stableSaveId(JSON.stringify([userId,setId,option.id,option.stages.map(stage => [stage.order_index,stage.stage_resources.map(r=>r.resource_id).sort()])]));
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

/** One transaction; stable IDs preserve progress when retrying an uncertain commit. */
export async function savePath(service: { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<WriteResult> }, userId: string, setId: string, pathSet: { field_id: string; skill_level: string; weekly_hours: number; budget_total: number; currency: string }, option: PathOption) {
  const id = pathSaveId(userId, setId, option);
  const stages = option.stages.map(stage => ({ id: stableSaveId(id + ":stage:" + stage.order_index), path_id: id, title: stage.title, order_index: stage.order_index, description: stage.description, estimated_hours: stage.estimated_hours }));
  const path = { id, user_id:userId, field_id:pathSet.field_id, skill_level:pathSet.skill_level, weekly_hours:pathSet.weekly_hours, budget_total:pathSet.budget_total, currency:pathSet.currency, status:"active" };
  const links = option.stages.flatMap((stage,i) => stage.stage_resources.map(sr=>({stage_id:stages[i].id,resource_id:sr.resource_id,order_index:sr.order_index,is_primary:sr.is_primary})));
  const progress = option.stages.map((stage,i) => ({stage_id:stages[i].id,user_id:userId,status:"not_started",practice_check:stage.practice_check ? {description:stage.practice_check} : {}}));
  await retryPathWrite(() => service.rpc("save_learning_path", { p_path: path, p_stages: stages, p_links: links, p_progress: progress }));
  return id;
}
