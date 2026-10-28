import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {loadLearningExport,readExportRows} from './learning-export';
import type {SupabaseClient} from '@supabase/supabase-js';
const rows:Record<string,unknown[]>={};const calls:{table:string;method:string;args:unknown[]}[]=[];
function client(){return {from:(table:string)=>{
 const query:Record<string,unknown>={};for(const method of ['select','eq','in','order','range','returns'])query[method]=(...args:unknown[])=>{calls.push({table,method,args});return query;};
 query.then=(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({data:rows[table]??[],error:null,count:(rows[table]??[]).length}));return query;
 }} as unknown as SupabaseClient;}
beforeEach(()=>{calls.length=0;Object.keys(rows).forEach(key=>delete rows[key]);});
describe('export pagination',()=>{
 it('continues through a smaller server response cap',async()=>{const fetch=vi.fn((start:number)=>Promise.resolve({data:[start],count:3,error:null}));expect(await readExportRows(fetch,10)).toEqual([0,1,2]);expect(fetch).toHaveBeenCalledTimes(3);});
 it('rejects oversized exports instead of truncating',async()=>{await expect(readExportRows(()=>Promise.resolve({data:[],count:101,error:null}),100)).rejects.toMatchObject({status:413});});
 it('rejects incomplete pages and database failures',async()=>{await expect(readExportRows(()=>Promise.resolve({data:[],count:1,error:null}),10)).rejects.toMatchObject({status:503});await expect(readExportRows(()=>Promise.resolve({data:null,count:null,error:{message:'DB details'}}),10)).rejects.toMatchObject({status:503});});
 it('rejects changed row counts during pagination',async()=>{let count=0;await expect(readExportRows(()=>Promise.resolve({data:[1],count:++count===1?2:3,error:null}),10)).rejects.toMatchObject({status:409});});
});
describe('owner scoped export loader',()=>{
 it('filters paths by authenticated owner and never queries children for a missing path',async()=>{await expect(loadLearningExport(client(),'owner','other-path')).rejects.toMatchObject({status:404});expect(calls).toContainEqual({table:'learning_paths',method:'eq',args:['user_id','owner']});expect(new Set(calls.map(c=>c.table))).toEqual(new Set(['learning_paths']));});
 it('restricts child reads to the returned paths and progress to the owner',async()=>{
  rows.learning_paths=[{id:'p',fields:{name:'Backend'},weekly_hours:5,budget_total:0,currency:'INR',skill_level:'beginner'}];rows.stages=[{id:'s',path_id:'p',title:'API',estimated_hours:10,order_index:1,description:null}];
  const result=await loadLearningExport(client(),'owner');expect(result.roadmaps).toHaveLength(1);
  expect(calls).toContainEqual({table:'stages',method:'in',args:['path_id',['p']]});expect(calls).toContainEqual({table:'stage_progress',method:'eq',args:['user_id','owner']});expect(calls).toContainEqual({table:'stage_resources',method:'in',args:['stage_id',['s']]});
 });
 it('returns an empty valid export without unrelated queries',async()=>{expect((await loadLearningExport(client(),'owner')).roadmaps).toEqual([]);expect(new Set(calls.map(c=>c.table))).toEqual(new Set(['learning_paths']));});
});
