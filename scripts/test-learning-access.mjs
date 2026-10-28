// Local-only database regression checks. Never connects to a hosted project.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
if(!process.argv[2]) throw new Error('Provide a separately installed PGlite module path.');
const {PGlite}=await import(pathToFileURL(resolve(process.argv[2])).href);
const db=new PGlite();
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
let checks=0;
const check=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
async function fail(sql,code){
 await db.exec('savepoint expected_error');let caught;
 try{await db.exec(sql);}catch(error){caught=error;}
 await db.exec('rollback to savepoint expected_error;release savepoint expected_error');
 check(caught?.code,code,sql);
}
async function identity(role,user,aal='aal1'){
 assert.ok(['anon','authenticated','service_role'].includes(role));
 await db.exec('reset role');
 await db.query("select set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:user?id(user):undefined,role,aal})]);
 await db.exec(`set local role ${role}`);
}
const call=(user=1,resource=id(40),subscription=null,expires=null)=>`select public.save_learning_access('${id(user)}',null,${resource?`'${resource}'`:'null'},${subscription?`'${subscription}'`:'null'},${expires?`'${expires}'`:'null'},true,null) id`;
const count=async()=>Number((await db.query('select count(*) n from public.learning_access')).rows[0].n);
try{
 await db.exec(await read('supabase/tests/resource_management_bootstrap.sql'));
 await db.exec(await read('supabase/tests/rls_optimization_bootstrap.sql'));
 await db.exec(await read('supabase/migrations/20261003190212_optional_totp_mfa_boundaries.sql'));
 const migration=await read('supabase/migrations/20261026073036_learning_access_library.sql');
 await db.exec(migration);await db.exec(migration);
 await db.exec(`update public.resources set resource_type='course',trust_status='allowlisted',link_status='ok' where id='${id(40)}'`);
 await db.exec('begin');
 await identity('service_role');
 const entry=(await db.query(call())).rows[0].id;
 await db.exec(call(2));
 await db.exec(call(1,null,'scrimba-pro','2027-01-01'));
 check(await count(),3,'Service can see library entries');
 await fail(call(),'23505');
 await fail(call(1,null,'scrimba-pro','2027-01-01'),'23505');
 await fail(call(1,null,'scrimba-pro'),'22023');
 await fail(call(1,null,'other','2027-01-01'),'22023');
 await fail(call(1,null,null),'22023');
 await fail(call(1,id(999)),'42501');
 await fail(call(1,id(40),null,'2100-01-01'),'22023');
 await fail(`insert into public.learning_access(user_id,access_type,expires_on) values('${id(1)}','subscription','2027-01-01')`,'23514');
 await fail(`select public.save_learning_access('${id(1)}','${entry}','${id(40)}',null,null,false,now())`,'40001');
 await fail(`select public.save_learning_access('${id(2)}','${entry}','${id(40)}',null,null,false,(select updated_at from public.learning_access where id='${entry}'))`,'40001');
 await db.exec(`select public.save_learning_access('${id(1)}','${entry}','${id(40)}',null,'2027-02-01',false,(select updated_at from public.learning_access where id='${entry}'))`);
 check((await db.query(`select active from public.learning_access where id='${entry}'`)).rows[0].active,false,'Pause persisted');
 await identity('authenticated',1,'aal2');check(await count(),2,'Owner reads only own access');
 await fail(call(),'42501');
 await fail(`update public.learning_access set active=true`,'42501');
 await fail(`delete from public.learning_access`,'42501');
 await fail(`insert into public.learning_access(user_id,access_type,resource_id) values('${id(1)}','course','${id(40)}')`,'42501');
 await identity('authenticated',1,'aal1');check(await count(),0,'Enrolled MFA blocks weaker session');
 await identity('authenticated',2);check(await count(),1,'Other owner isolation');
 await identity('authenticated',3,'aal2');check(await count(),0,'Admin cannot read personal libraries');
 await identity('anon');await fail('select * from public.learning_access','42501');await fail(call(),'42501');
 await identity('service_role');
 for(const field of ["link_status='broken'","trust_status='pending'","resource_type='docs'"]){
  await db.exec(`update public.resources set ${field} where id='${id(40)}'`);
  await fail(call(3),'42501');
  await db.exec(`update public.resources set link_status='ok',trust_status='allowlisted',resource_type='course' where id='${id(40)}'`);
 }
 await db.exec(`insert into public.resources(id,title,resource_type,trust_status) select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'Local fixture','course','allowlisted' from generate_series(1000,1199) n`);
 await db.exec(`insert into public.learning_access(user_id,access_type,resource_id) select '${id(3)}','course',id from public.resources where title='Local fixture'`);
 await fail(call(3),'54000');
 await db.exec('rollback');
 console.log(`PASS: ${checks} local library permission and validation checks; migration replay passed.`);
}finally{await db.close();}
