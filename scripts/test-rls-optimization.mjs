// Local-only RLS regression test. No environment variables or network connections.
// Usage: node scripts/test-rls-optimization.mjs /path/to/@electric-sql/pglite/dist/index.js
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
if(!process.argv[2]) throw new Error('Provide a separately installed PGlite module path.');
const {PGlite}=await import(pathToFileURL(resolve(process.argv[2])).href);
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const db=new PGlite();
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
let assertions=0;
const check=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);assertions++;};
const rows=async sql=>(await db.query(sql)).rows;
const count=async table=>Number((await rows(`select count(*) n from public.${table}`))[0].n);
async function identity(role,user,aal='aal1'){
 assert.ok(['anon','authenticated','service_role'].includes(role));
 await db.exec('reset role');
 await db.query("select set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:user?id(user):undefined,role,aal})]);
 await db.exec(`set local role ${role}`);
}
async function denied(sql){
 await db.exec('savepoint expected_denial');
 let error;
 try{await db.exec(sql);}catch(caught){error=caught;}
 await db.exec('rollback to savepoint expected_denial; release savepoint expected_denial');
 check(error?.code,'42501',`Expected permission denial: ${sql}`);
}
async function exercise(optimized){
 await db.exec('begin');
 try{
  for(const user of [1,2]){
   await identity('authenticated',user,user===1?'aal2':'aal1');
   for(const table of ['learning_paths','stages','stage_resources','resource_ratings']) check(await count(table),1,`${table}: owner isolation`);
   check((await rows('select user_id from public.learning_paths'))[0].user_id,id(user),'Only owner roadmap visible');
   check(await count('resources'),1,'Signed-in catalog read');
   check(await count('trusted_sources'),1,'Signed-in source read');
  }
  await identity('authenticated',1,'aal1');
  for(const table of ['learning_paths','stages','stage_resources','resource_ratings','trusted_sources']) check(await count(table),0,`${table}: MFA required`);
  check(await count('resources'),1,'Public course catalog remains nonpersonal');
  await identity('authenticated',3,'aal2');
  for(const table of ['learning_paths','stages','stage_resources','resource_ratings']) check(await count(table),0,'Admin cannot read other learners');
  await db.exec("insert into public.trusted_sources(source_name) values('Temporary admin insert')");
  check((await rows("update public.trusted_sources set source_name='Reviewed' returning id")).length,2,'Admin update');
  check((await rows("delete from public.trusted_sources where source_name='Reviewed' returning id")).length,2,'Admin delete');
  await db.exec("insert into public.trusted_sources(source_name) values('Retained local fixture')");
  await identity('authenticated',3,'aal1');
  await denied("insert into public.trusted_sources(source_name) values('MFA bypass')");
  check((await rows("update public.trusted_sources set source_name='MFA bypass' returning id")).length,0,'Admin AAL1 update denied');
  await identity('authenticated',2);
  await denied("insert into public.trusted_sources(source_name) values('Non-admin')");
  check((await rows("update public.trusted_sources set source_name='Non-admin' returning id")).length,0,'Non-admin update denied');
  check((await rows('delete from public.trusted_sources returning id')).length,0,'Non-admin delete denied');
  await db.exec(`insert into public.learning_paths(id,user_id,weekly_hours,budget_total,currency) values('${id(50)}','${id(2)}',8,500,'USD')`);
  check((await rows(`update public.learning_paths set weekly_hours=9 where id='${id(50)}' returning id`)).length,1,'Owner pace edit');
  await denied(`update public.learning_paths set user_id='${id(1)}' where id='${id(50)}'`);
  await denied(`insert into public.learning_paths(id,user_id) values('${id(51)}','${id(1)}')`);
  check((await rows(`update public.learning_paths set weekly_hours=2 where id='${id(11)}' returning id`)).length,0,'Other owner update denied');
  check((await rows(`delete from public.learning_paths where id='${id(11)}' returning id`)).length,0,'Other owner delete denied');
  check((await rows(`delete from public.learning_paths where id='${id(50)}' returning id`)).length,1,'Owner delete');
  await denied('update public.stages set title=\'Tampered\'');
  await denied(`insert into public.resource_ratings(user_id,resource_id,rating) values('${id(2)}','${id(40)}',5)`);
  await denied("insert into public.resources(id,title) values(gen_random_uuid(),'Tampered')");
  if(optimized){
   await denied("update public.resources set title='Tampered'");
   await denied('truncate public.resources cascade');
   await denied('truncate public.trusted_sources cascade');
  }else{
   check((await rows("update public.resources set title='Tampered' returning id")).length,0,'Legacy resource writes blocked by RLS');
  }
  await identity('anon');
  if(optimized){
   await denied('select * from public.resources');
   await denied('select * from public.trusted_sources');
   await denied('truncate public.resources cascade');
   await denied('truncate public.trusted_sources cascade');
  }else{
   check(await count('resources'),0,'Legacy anonymous catalog read denied by RLS');
   check(await count('trusted_sources'),0,'Legacy anonymous source read denied by RLS');
  }
  await denied('select * from public.learning_paths');
  await identity('service_role');
  check(await count('learning_paths'),2,'Maintenance access to both paths');
  await db.exec("update public.resources set title='Service-maintained'; insert into public.trusted_sources(source_name) values('Service source')");
  check(await count('trusted_sources'),2,'Service catalog maintenance');
 }finally{await db.exec('rollback');}
}
try{
 await db.exec(await read('supabase/tests/resource_management_bootstrap.sql'));
 await db.exec(await read('supabase/tests/rls_optimization_bootstrap.sql'));
 await db.exec(await read('supabase/migrations/20261003190212_optional_totp_mfa_boundaries.sql'));
 const restrictiveBefore=await rows("select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' and permissive='RESTRICTIVE' order by tablename,policyname");
 const serviceBefore=await rows("select table_name,privilege_type from information_schema.role_table_grants where table_schema='public' and grantee='service_role' order by table_name,privilege_type");
 await exercise(false);
 const migration=await read('supabase/migrations/20261025183647_optimize_existing_rls_policies.sql');
 await db.exec(migration);await db.exec(migration);
 await exercise(true);
 check(await rows("select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' and permissive='RESTRICTIVE' order by tablename,policyname"),restrictiveBefore,'MFA policies unchanged');
 check(await rows("select table_name,privilege_type from information_schema.role_table_grants where table_schema='public' and grantee='service_role' order by table_name,privilege_type"),serviceBefore,'Maintenance grants unchanged');
 check((await rows("select count(*) n from pg_policies where tablename='trusted_sources' and permissive='PERMISSIVE' and cmd in ('SELECT','ALL')"))[0].n,1,'One source read policy');
 for(const role of ['anon','authenticated']){
  for(const table of ['resources','trusted_sources']){
   for(const privilege of ['TRUNCATE','TRIGGER','REFERENCES']) check((await rows(`select has_table_privilege('${role}','public.${table}','${privilege}') allowed`))[0].allowed,false,'No destructive catalog grants');
  }
  check((await rows(`select has_column_privilege('${role}','public.resources','title','UPDATE') allowed`))[0].allowed,false,'No inherited column write grant');
 }
 await db.exec('begin');await identity('authenticated',2);
 const plan=JSON.stringify(await rows('explain (format json) select * from public.learning_paths'));
 check(plan.includes('InitPlan'),true,'Identity lookup planned as InitPlan');
 check(plan.includes('auth.uid()'),false,'No per-row auth.uid() in roadmap plan');
 await db.exec('rollback');
 check((await rows('select count(*) n from public.learning_paths'))[0].n,2,'Mutation fixtures rolled back');
 check((await rows('select count(*) n from public.trusted_sources'))[0].n,1,'Admin fixtures rolled back');
 console.log(`PASS: ${assertions} assertions; before/after owner, admin, MFA, read/write isolation, catalog least privilege, service maintenance, InitPlan and rerun checks.`);
}finally{await db.close();}