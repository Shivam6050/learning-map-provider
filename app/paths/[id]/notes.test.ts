import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ from: vi.fn(), update: vi.fn(), insert: vi.fn(), read: {data:{practice_check:{description:'Keep challenge'}},error:null} as any, saved: {data:{stage_id:'saved'},error:null} as any }));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:mock.from})}));
vi.mock('@/lib/supabase/service',()=>({createServiceClient:vi.fn()}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
import { savePracticeNote } from './actions';
const form=()=>{const f=new FormData();f.set('stageId','11111111-1111-4111-8111-111111111111');f.set('pathId','22222222-2222-4222-8222-222222222222');f.set('submissionNote','My notes');return f;};
beforeEach(()=>{
 mock.update.mockClear();mock.insert.mockClear();
 mock.read={data:{practice_check:{description:'Keep challenge'}},error:null};mock.saved={data:{stage_id:'saved'},error:null};
 mock.from.mockImplementation((table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>table==='stages'?{data:{id:'owned'},error:null}:mock.read,single:async()=>mock.saved,update:(v:any)=>{mock.update(v);return q;},insert:(v:any)=>{mock.insert(v);return q;}};return q;});
});
it('saves notes without requiring updated_at or overwriting progress status',async()=>{expect(await savePracticeNote(form())).toEqual({ok:true});expect(mock.update).toHaveBeenCalledWith({practice_check:{description:'Keep challenge',user_submission:'My notes',submitted_at:expect.any(String)}});});
it('creates missing progress instead of silently saving zero rows',async()=>{mock.read={data:null,error:null};expect((await savePracticeNote(form())).ok).toBe(true);expect(mock.insert).toHaveBeenCalled();});
it('does not overwrite notes when the read fails',async()=>{mock.read={data:null,error:{message:'timeout'}};expect((await savePracticeNote(form())).ok).toBe(false);expect(mock.update).not.toHaveBeenCalled();expect(mock.insert).not.toHaveBeenCalled();});
it('returns an inline error for a failed write',async()=>{mock.saved={data:null,error:{message:'timeout'}};expect((await savePracticeNote(form())).ok).toBe(false);});
