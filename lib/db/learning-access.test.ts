vi.mock('server-only',()=>({}));
import {it,expect,vi} from 'vitest';
import type {SupabaseClient} from '@supabase/supabase-js';
import {loadLearningAccess} from './learning-access';
it('binds access reads to the signed-in owner and bounds the result',async()=>{
 const filters:unknown[]=[];const q={select:()=>q,eq:(...args:unknown[])=>{filters.push(args);return q;},order:()=>q,limit:async(n:number)=>{expect(n).toBe(200);return {data:[{id:'own-entry'}],error:null};}};
 const client={from:(table:string)=>{expect(table).toBe('learning_access');return q;}} as unknown as SupabaseClient;
 expect(await loadLearningAccess(client,'owner')).toEqual({entries:[{id:'own-entry'}],available:true});expect(filters).toEqual([['user_id','owner']]);
});
it.each(['error','throw'])('does not assume access on a %s',async kind=>{
 const q={select:()=>q,eq:()=>q,order:()=>q,limit:async()=>{if(kind==='throw')throw new Error('offline');return {data:[{id:'unusable'}],error:{message:'Unavailable'}};}};
 expect(await loadLearningAccess({from:()=>q} as unknown as SupabaseClient,'owner')).toEqual({entries:[],available:false});
});