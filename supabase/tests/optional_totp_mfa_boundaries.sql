-- MFA policies with rolled-back synthetic accounts only.
begin;
select set_config('test.mfa_owner',gen_random_uuid()::text,true),
 set_config('test.mfa_other',gen_random_uuid()::text,true),
 set_config('test.mfa_factor',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('test.mfa_owner')::uuid),(current_setting('test.mfa_other')::uuid);
insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at,secret)
 values(current_setting('test.mfa_factor')::uuid,current_setting('test.mfa_owner')::uuid,'totp','unverified',now(),now(),'unused-test-fixture');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.mfa_owner'),'role','authenticated','aal','aal1')::text,true);
do $$ begin
 if not private.mfa_session_allowed() or (select count(*) from public.profiles)<>1 then raise exception 'Unverified setup changed account access'; end if;
end $$;
reset role;
update auth.mfa_factors set status='verified' where id=current_setting('test.mfa_factor')::uuid;
set local role authenticated;
do $$ declare n integer; begin
 if private.mfa_session_allowed() or exists(select 1 from public.profiles) then raise exception 'Old AAL1 token bypassed MFA'; end if;
 update public.profiles set display_name='Tampered';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'AAL1 could write private data'; end if;
 begin
  perform secret from auth.mfa_factors;
  raise exception 'Factor secrets readable';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.mfa_other'),'role','authenticated','aal','aal1')::text,true);
do $$ begin
 if not private.mfa_session_allowed() or (select count(*) from public.profiles)<>1 then raise exception 'Another user enrollment forced MFA on everyone'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.mfa_owner'),'role','authenticated','aal','aal2')::text,true);
do $$ declare n integer; begin
 if not private.mfa_session_allowed() or (select count(*) from public.profiles)<>1 then raise exception 'Verified MFA session cannot read own profile'; end if;
 if exists(select 1 from public.profiles where id=current_setting('test.mfa_other')::uuid) then raise exception 'MFA bypassed ownership'; end if;
 update public.profiles set display_name='Verified owner' where id=auth.uid();
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Verified owner updates broken'; end if;
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','private.mfa_session_allowed()','EXECUTE') then raise exception 'Anonymous factor lookup callable'; end if;
 if (select count(*) from pg_policies where schemaname='public' and policyname='enrolled_mfa_required' and permissive='RESTRICTIVE')<>9 then raise exception 'MFA table coverage incomplete'; end if;
end $$;
rollback;
select true as mfa_boundary_checks_passed;
