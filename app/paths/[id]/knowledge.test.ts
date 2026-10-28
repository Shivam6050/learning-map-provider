import {beforeEach,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const state=vi.hoisted(()=>({user:true,path:true,stage:true,errorTable:'',reference:undefined as unknown,authError:null as Error|null}));
const calls=vi.hoisted(()=>[] as {table:string;key:string;value:unknown}[]);
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:(table:string)=>{const query={select:()=>query,eq:(key:string,value:unknown)=>{calls.push({table,key,value});return query;},maybeSingle:async()=>({error:state.errorTable===table?{message:'PRIVATE_DIAGNOSTIC'}:null,data:table==='learning_paths'?(state.path?{id:'path'}:null):table==='stages'?(state.stage?{title:'HTTP and SQL',description:null}:null):{practice_check:{curriculum_ref:state.reference}}})};return query;}})}));
vi.mock('@/lib/auth/learning-user',()=>({getLearningUser:async()=>{if(state.authError)throw state.authError;return {data:{user:state.user?{id:'owner'}:null}};}}));
import {loadStageKnowledge,submitStageKnowledge} from './knowledge';
import {stageQuestions,publicQuiz} from '@/lib/assessment/stage-knowledge-bank';
import {redirect} from 'next/navigation';
const path='11111111-1111-4111-8111-111111111111',stage='22222222-2222-4222-8222-222222222222';
beforeEach(()=>{Object.assign(state,{user:true,path:true,stage:true,errorTable:'',reference:undefined,authError:null});calls.length=0;});
it('checks path ownership, stage membership and owner progress before offering questions',async()=>{
 const result=await loadStageKnowledge(path,stage);expect(result.ok).toBe(true);expect(result.quiz?.questions.length).toBeGreaterThan(0);
 expect(calls).toContainEqual({table:'learning_paths',key:'user_id',value:'owner'});expect(calls).toContainEqual({table:'stages',key:'path_id',value:path});expect(calls).toContainEqual({table:'stage_progress',key:'user_id',value:'owner'});
});
it.each(['signed-out','other-owner','missing-stage','stage-error','progress-error','malformed-reference'])('does not offer questions for %s',async kind=>{
 if(kind==='signed-out')state.user=false;if(kind==='other-owner')state.path=false;if(kind==='missing-stage')state.stage=false;if(kind==='stage-error')state.errorTable='stages';if(kind==='progress-error')state.errorTable='stage_progress';if(kind==='malformed-reference')state.reference={id:123};
 const result=await loadStageKnowledge(path,stage);expect(result.ok).toBe(false);expect(result.quiz).toBeUndefined();expect(JSON.stringify(result)).not.toContain('PRIVATE_DIAGNOSTIC');
});
it('validates identifiers before any database read',async()=>{expect((await loadStageKnowledge('bad',stage)).ok).toBe(false);expect(calls).toEqual([]);});
it('rechecks ownership at submission and ignores a client score',async()=>{
 const questions=stageQuestions('HTTP and SQL',null),version=publicQuiz(questions).version,answers=questions.map(q=>({id:q.id,choice:q.correct,score:0}));
 expect((await submitStageKnowledge(path,stage,version,answers)).result?.correct).toBe(questions.length);
 state.path=false;expect((await submitStageKnowledge(path,stage,version,answers)).result).toBeUndefined();
});
it('rejects stale, oversized and malformed submissions without returning a score',async()=>{
 expect((await submitStageKnowledge(path,stage,'old',[])).result).toBeUndefined();calls.length=0;
 expect((await submitStageKnowledge(path,stage,'v',Array(5).fill({}))).ok).toBe(false);expect(calls).toEqual([]);
});
it('preserves Next.js MFA redirects rather than replacing them with a generic error',async()=>{
 try{redirect('/auth/mfa');}catch(error){state.authError=error as Error;}
 await expect(loadStageKnowledge(path,stage)).rejects.toMatchObject({digest:expect.stringContaining('NEXT_REDIRECT')});
});
