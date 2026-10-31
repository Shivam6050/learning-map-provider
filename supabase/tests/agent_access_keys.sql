-- Isolated fixtures are rolled back; no existing users, keys or learning data change.
begin;
select set_config('test.agent_owner',gen_random_uuid()::text,true), set_config('test.agent_other',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('test.agent_owner')::uuid),(current_setting('test.agent_other')::uuid);
set local role service_role;
select public.create_agent_access_key(current_setting('test.agent_owner')::uuid,'Owner fixture',repeat('a',64));
select public.create_scoped_agent_access_key(current_setting('test.agent_other')::uuid,'Personal fixture',repeat('f',64),true,true);
select public.create_agent_access_key(current_setting('test.agent_other')::uuid,'Other fixture',repeat('b',64));
reset role;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.agent_owner'),'role','authenticated')::text,true);
do $$
begin
 if (select count(id) from public.agent_access_keys) <> 1 then raise exception 'Owner RLS isolation failed'; end if;
 if exists(select id from public.agent_access_keys where user_id=current_setting('test.agent_other')::uuid) then raise exception 'Cross-owner metadata leaked'; end if;
 begin
  perform token_hash from public.agent_access_keys;
  raise exception 'Credential hash was readable';
 exception when insufficient_privilege then null; end;
 begin
  update public.agent_access_keys set label='Tampered';
  raise exception 'Direct credential update allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.create_agent_access_key(current_setting('test.agent_owner')::uuid,'Unauthorized',repeat('c',64));
  raise exception 'Client could issue keys through RPC';
 exception when insufficient_privilege then null; end;
end;
$$;
reset role;
set local role anon;
do $$
begin
 begin
  perform id from public.agent_access_keys;
  raise exception 'Anonymous metadata access allowed';
 exception when insufficient_privilege then null; end;
end;
$$;
reset role;
set local role service_role;
do $$
declare u uuid:=current_setting('test.agent_owner')::uuid; n integer;
begin
 for n in 2..5 loop perform public.create_agent_access_key(u,'Active fixture '||n,lpad(n::text,64,'0')); end loop;
 begin
  perform public.create_agent_access_key(u,'Excess active key',repeat('d',64));
  raise exception 'Active cap bypassed';
 exception when sqlstate 'P0001' then
  if sqlerrm <> 'Agent key active limit reached' then raise; end if;
 end;
 update public.agent_access_keys set revoked_at=now() where user_id=u;
 for n in 6..10 loop perform public.create_agent_access_key(u,'Daily fixture '||n,lpad(n::text,64,'0')); end loop;
 begin
  perform public.create_agent_access_key(u,'Excess daily key',repeat('e',64));
  raise exception 'Daily cap bypassed';
 exception when sqlstate 'P0001' then
  if sqlerrm <> 'Agent key daily limit reached' then raise; end if;
 end;
 if (select count(*) from public.agent_access_keys where user_id=u) <> 10 then raise exception 'Invalid quota accounting'; end if;
end;
$$;
reset role;
do $$
begin
 if has_table_privilege('authenticated','public.agent_access_keys','INSERT') or has_table_privilege('anon','public.agent_access_keys','SELECT') then raise exception 'Unexpected broad privileges'; end if;
 if (select prosecdef from pg_proc where oid='public.create_agent_access_key(uuid,text,text)'::regprocedure) then raise exception 'Legacy issuance function must remain SECURITY INVOKER'; end if;
 if (select prosecdef from pg_proc where oid='public.create_scoped_agent_access_key(uuid,text,text,boolean,boolean)'::regprocedure) then raise exception 'Scoped issuance function must be SECURITY INVOKER'; end if;
 if not exists(select 1 from public.agent_access_keys where user_id=current_setting('test.agent_other')::uuid and label='Personal fixture' and personal_read and progress_write) then raise exception 'Personal scopes were not persisted'; end if;
 begin
  perform public.create_scoped_agent_access_key(current_setting('test.agent_owner')::uuid,'Invalid scope',repeat('c',64),false,true);
  raise exception 'Progress write without personal read was accepted';
 exception when sqlstate '22023' then null; end;
 if (select prosecdef from pg_proc where oid='public.update_agent_stage_progress(uuid,uuid,uuid,text)'::regprocedure) is false then raise exception 'Progress RPC must be SECURITY DEFINER'; end if;
 if has_function_privilege('authenticated','public.update_agent_stage_progress(uuid,uuid,uuid,text)','EXECUTE') or has_function_privilege('anon','public.update_agent_stage_progress(uuid,uuid,uuid,text)','EXECUTE') then raise exception 'Progress RPC has unexpected client grants'; end if;
 delete from auth.users where id=current_setting('test.agent_owner')::uuid;
 delete from auth.users where id=current_setting('test.agent_other')::uuid;
 if exists(select 1 from public.agent_access_keys where user_id=current_setting('test.agent_owner')::uuid) then raise exception 'Deleted account retained keys'; end if;
end;
$$;
rollback;
select true as agent_key_security_checks_passed;
