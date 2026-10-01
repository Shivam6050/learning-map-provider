import { beforeEach, expect, it, vi } from 'vitest';
type Result={data:Record<string,unknown>|null;error:{message:string}|null};
const mock = vi.hoisted(() => ({ from: vi.fn(), update: vi.fn(), insert: vi.fn(), read: {data:{practice_check:{description:'Keep challenge'}},error:null} as Result, saved: {data:{stage_id:'saved'},error:null} as Result }));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'owner',user_metadata:{country_of_residence:'IN'}}}})},from:mock.from})}));
vi.mock('@/lib/supabase/service',()=>({createServiceClient:vi.fn()}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
import { savePracticeNote } from './actions';
const form=()=>{const f=new FormData();f.set('stageId','11111111-1111-4111-8111-111111111111');f.set('pathId','22222222-2222-4222-8222-222222222222');f.set('submissionNote','My notes');return f;};
beforeEach(()=>{
 mock.update.mockClear();mock.insert.mockClear();
 mock.read={data:{practice_check:{description:'Keep challenge'}},error:null};mock.saved={data:{stage_id:'saved'},error:null};
 mock.from.mockImplementation((table:string)=>{const q: {select:()=>typeof q;eq:()=>typeof q;maybeSingle:()=>Promise<Result>;single:()=>Promise<Result>;update:(v:unknown)=>typeof q;insert:(v:unknown)=>typeof q}={select:()=>q,eq:()=>q,maybeSingle:async()=>table==='stages'?{data:{id:'owned'},error:null}:mock.read,single:async()=>mock.saved,update:(v:unknown)=>{mock.update(v);return q;},insert:(v:unknown)=>{mock.insert(v);return q;}};return q;});
});
it('updates note activity without overwriting progress status',async()=>{expect(await savePracticeNote(form())).toEqual({ok:true});expect(mock.update).toHaveBeenCalledWith({updated_at:expect.any(String),practice_check:{description:'Keep challenge',user_submission:'My notes',submitted_at:expect.any(String)}});});
it('creates missing progress instead of silently saving zero rows',async()=>{mock.read={data:null,error:null};expect((await savePracticeNote(form())).ok).toBe(true);expect(mock.insert).toHaveBeenCalled();});
it('does not overwrite notes when the read fails',async()=>{mock.read={data:null,error:{message:'timeout'}};expect((await savePracticeNote(form())).ok).toBe(false);expect(mock.update).not.toHaveBeenCalled();expect(mock.insert).not.toHaveBeenCalled();});
it('returns an inline error for a failed write',async()=>{mock.saved={data:null,error:{message:'timeout'}};expect((await savePracticeNote(form())).ok).toBe(false);});

it('rejects inaccessible stages before writing notes',async()=>{
 mock.from.mockImplementation(()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:null,error:null})};return q;});
 expect((await savePracticeNote(form())).ok).toBe(false);
 expect(mock.update).not.toHaveBeenCalled();expect(mock.insert).not.toHaveBeenCalled();
});
it('rejects malformed stage identifiers before querying',async()=>{
 mock.from.mockClear();const f=form();f.set('stageId','invalid');
 expect((await savePracticeNote(f)).ok).toBe(false);expect(mock.from).not.toHaveBeenCalled();
});
it('rejects oversized notes without writes',async()=>{
 const f=form();f.set('submissionNote','x'.repeat(10001));
 expect((await savePracticeNote(f)).ok).toBe(false);
 expect(mock.update).not.toHaveBeenCalled();expect(mock.insert).not.toHaveBeenCalled();
});
