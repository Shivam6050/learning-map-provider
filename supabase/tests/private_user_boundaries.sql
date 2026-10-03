-- Synthetic accounts only; all fixture data is rolled back.
begin;
select set_config('test.privacy_owner',gen_random_uuid()::text,true),
 set_config('test.privacy_other',gen_random_uuid()::text,true),
 set_config('test.privacy_admin',gen_random_uuid()::text,true),
 set_config('test.privacy_field',gen_random_uuid()::text,true),
 set_config('test.privacy_path',gen_random_uuid()::text,true),
 set_config('test.privacy_other_path',gen_random_uuid()::text,true),
 set_config('test.privacy_stage',gen_random_uuid()::text,true),
 set_config('test.privacy_other_stage',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('test.privacy_owner')::uuid),
 (current_setting('test.privacy_other')::uuid),(current_setting('test.privacy_admin')::uuid);
-- Provision a synthetic curator without changing any real administrator.
delete from public.profiles where id=current_setting('test.privacy_admin')::uuid;
insert into public.profiles(id,role) values(current_setting('test.privacy_admin')::uuid,'admin');
insert into public.fields(id,name,slug) values(current_setting('test.privacy_field')::uuid,
 'Privacy QA '||current_setting('test.privacy_field'),'privacy-qa-'||current_setting('test.privacy_field'));
insert into public.learning_paths(id,user_id,field_id,skill_level,weekly_hours) values
 (current_setting('test.privacy_path')::uuid,current_setting('test.privacy_owner')::uuid,current_setting('test.privacy_field')::uuid,'beginner',5),
 (current_setting('test.privacy_other_path')::uuid,current_setting('test.privacy_other')::uuid,current_setting('test.privacy_field')::uuid,'beginner',5);
insert into public.stages(id,path_id,title,order_index) values
 (current_setting('test.privacy_stage')::uuid,current_setting('test.privacy_path')::uuid,'Owner stage',1),
 (current_setting('test.privacy_other_stage')::uuid,current_setting('test.privacy_other_path')::uuid,'Other stage',1);
insert into public.stage_progress(stage_id,user_id,practice_check) values
 (current_setting('test.privacy_stage')::uuid,current_setting('test.privacy_owner')::uuid,'{"user_submission":"private owner note"}'),
 (current_setting('test.privacy_other_stage')::uuid,current_setting('test.privacy_other')::uuid,'{"user_submission":"private other note"}');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.privacy_owner'),'role','authenticated')::text,true);
do $$
declare n integer;
begin
 if (select count(*) from public.profiles) <> 1 then raise exception 'Profile isolation failed'; end if;
 update public.profiles set display_name='Owner updated',avatar_id='owl' where id=auth.uid();
 get diagnostics n = row_count;
 if n<>1 then raise exception 'Owner profile update broken'; end if;
 if exists(select 1 from public.profiles where id=current_setting('test.privacy_other')::uuid) then raise exception 'Other profile leaked'; end if;
 begin
  update public.profiles set role='admin' where id=auth.uid();
  raise exception 'Client role change allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.profiles set id=gen_random_uuid() where id=auth.uid();
  raise exception 'Client identity change allowed';
 exception when insufficient_privilege then null; end;
 if (select count(*) from public.learning_paths)<>1 or (select count(*) from public.stages)<>1 then raise exception 'Roadmap isolation failed'; end if;
 if (select count(*) from public.stage_progress)<>1 then raise exception 'Notes isolation failed'; end if;
 update public.stage_progress set practice_check='{"user_submission":"updated owner note"}' where stage_id=current_setting('test.privacy_stage')::uuid;
 get diagnostics n = row_count;
 if n<>1 then raise exception 'Owner notes update broken'; end if;
 update public.stage_progress set practice_check='{}' where stage_id=current_setting('test.privacy_other_stage')::uuid;
 get diagnostics n = row_count;
 if n<>0 then raise exception 'Other notes writable'; end if;
 begin
  insert into public.stage_progress(stage_id,user_id) values(current_setting('test.privacy_other_stage')::uuid,auth.uid());
  raise exception 'Foreign stage accepted owner spoof';
 exception when insufficient_privilege then null; end;
 update public.learning_paths set user_id=current_setting('test.privacy_other')::uuid where id=current_setting('test.privacy_other_path')::uuid;
 get diagnostics n = row_count;
 if n<>0 then raise exception 'Other roadmap writable'; end if;
 begin
  update public.learning_paths set user_id=current_setting('test.privacy_other')::uuid where id=current_setting('test.privacy_path')::uuid;
  raise exception 'Roadmap owner reassignment allowed';
 exception when insufficient_privilege then null; end;
end;
$$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.privacy_admin'),'role','authenticated')::text,true);
do $$
begin
 if not public.is_admin() then raise exception 'Curator authority broken'; end if;
 insert into public.trusted_sources(field_id,source_name,platform,added_by,approved)
 values(current_setting('test.privacy_field')::uuid,'Privacy curator fixture','docs','admin',true);
 if (select count(*) from public.profiles)<>1 then raise exception 'Admin can read another profile'; end if;
 if exists(select 1 from public.stage_progress) then raise exception 'Admin can read private notes'; end if;
end;
$$;
reset role;
set local role anon;
do $$
begin
 begin
  perform display_name from public.profiles;
  raise exception 'Anonymous profile read allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform practice_check from public.stage_progress;
  raise exception 'Anonymous notes read allowed';
 exception when insufficient_privilege then null; end;
end;
$$;
reset role;
do $$
declare t text; privilege text;
begin
 foreach t in array array['profiles','learning_paths','stages','stage_resources','stage_progress','resource_ratings','pending_path_sets','agent_access_keys','generation_quotas','generation_global_quota','reminder_deliveries','reminder_scan_cursor'] loop
  foreach privilege in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
   if has_table_privilege('anon','public.'||t,privilege) then raise exception 'Anonymous % privilege on %',privilege,t; end if;
  end loop;
  if has_table_privilege('authenticated','public.'||t,'TRUNCATE') or has_table_privilege('authenticated','public.'||t,'TRIGGER') or has_table_privilege('authenticated','public.'||t,'REFERENCES') then raise exception 'Unneeded structural permissions on %',t; end if;
 end loop;
 if has_column_privilege('authenticated','public.profiles','role','UPDATE') then raise exception 'Role update grant remains'; end if;
 if has_column_privilege('authenticated','public.agent_access_keys','token_hash','SELECT') then raise exception 'Credential hash grant remains'; end if;
 if (select prosecdef from pg_proc where oid='public.is_admin()'::regprocedure) then raise exception 'Admin check bypasses RLS'; end if;
 if has_function_privilege('anon','public.is_admin()','EXECUTE') then raise exception 'Anonymous admin helper available'; end if;
 if not has_table_privilege('service_role','public.profiles','UPDATE') then raise exception 'Trusted backend profile updates broken'; end if;
 if (select practice_check->>'user_submission' from public.stage_progress where stage_id=current_setting('test.privacy_other_stage')::uuid)<>'private other note' then raise exception 'Other notes modified'; end if;
end;
$$;
rollback;
select true as private_user_boundary_checks_passed;
