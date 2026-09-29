begin;
-- A service-only RPC: callers validate the signed-in owner and selected pending option.
-- A failed insert rolls back the entire statement, including the parent path.
create or replace function public.save_learning_path(p_path jsonb, p_stages jsonb, p_links jsonb, p_progress jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  path_id uuid := (p_path->>'id')::uuid;
  owner_id uuid := (p_path->>'user_id')::uuid;
begin
  if jsonb_array_length(p_stages) = 0 or jsonb_array_length(p_stages) > 100 then
    raise exception 'Invalid stages';
  end if;
  -- Serialize retries for the same path before checking/upserting its children.
  perform pg_advisory_xact_lock(hashtextextended(path_id::text, 0));
  if exists(select 1 from public.learning_paths p where p.id = path_id and p.user_id <> owner_id) then
    raise exception 'Path ownership mismatch';
  end if;
  if exists(select 1 from jsonb_array_elements(p_stages) s where (s->>'path_id')::uuid is distinct from path_id)
    or exists(select 1 from jsonb_array_elements(p_progress) p where (p->>'user_id')::uuid is distinct from owner_id)
    or exists(select 1 from jsonb_array_elements(p_links || p_progress) r where not exists (
      select 1 from jsonb_array_elements(p_stages) s where s->>'id' = r->>'stage_id')) then
    raise exception 'Invalid path relationships';
  end if;
  insert into public.learning_paths(id,user_id,field_id,skill_level,weekly_hours,budget_total,currency,status)
  select x.id,x.user_id,x.field_id,x.skill_level,x.weekly_hours,x.budget_total,x.currency,'active'
  from jsonb_populate_record(null::public.learning_paths,p_path) x on conflict(id) do nothing;
  insert into public.stages(id,path_id,title,order_index,description,estimated_hours)
  select x.id,x.path_id,x.title,x.order_index,x.description,x.estimated_hours
  from jsonb_populate_recordset(null::public.stages,p_stages) x on conflict(id) do nothing;
  insert into public.stage_resources(stage_id,resource_id,order_index,is_primary)
  select x.stage_id,x.resource_id,x.order_index,x.is_primary
  from jsonb_populate_recordset(null::public.stage_resources,p_links) x on conflict(stage_id,resource_id) do nothing;
  insert into public.stage_progress(stage_id,user_id,status,practice_check)
  select x.stage_id,x.user_id,x.status,x.practice_check
  from jsonb_populate_recordset(null::public.stage_progress,p_progress) x on conflict(stage_id,user_id) do nothing;
  return path_id;
end;
$$;
revoke all on function public.save_learning_path(jsonb,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.save_learning_path(jsonb,jsonb,jsonb,jsonb) to service_role;

do $$
declare
 owner_id uuid; field_id uuid; resource_id uuid;
 path_id uuid := gen_random_uuid(); test_stage_id uuid := gen_random_uuid();
 p jsonb; s jsonb; r jsonb; progress jsonb;
begin
 select id into owner_id from public.profiles limit 1;
 select id into field_id from public.fields limit 1;
 select id into resource_id from public.resources limit 1;
 if owner_id is null or field_id is null or resource_id is null then raise exception 'Test prerequisites missing'; end if;
 p=jsonb_build_object('id',path_id,'user_id',owner_id,'field_id',field_id,'skill_level','beginner','weekly_hours',5,'budget_total',0,'currency','INR');
 s=jsonb_build_array(jsonb_build_object('id',test_stage_id,'path_id',path_id,'title','Transaction verification','order_index',0,'estimated_hours',5));
 r=jsonb_build_array(jsonb_build_object('stage_id',test_stage_id,'resource_id',gen_random_uuid(),'order_index',0,'is_primary',true));
 progress=jsonb_build_array(jsonb_build_object('stage_id',test_stage_id,'user_id',owner_id,'status','not_started','practice_check',jsonb_build_object('description','Test')));
 begin
   perform public.save_learning_path(p,s,r,progress);
   raise exception 'Expected invalid resource to fail';
 exception when foreign_key_violation then null;
 end;
 if exists(select 1 from public.learning_paths where id=path_id) then raise exception 'Failed save left a parent row';end if;
 if exists(select 1 from public.stages where id=test_stage_id) then raise exception 'Failed save left a stage row';end if;
 r=jsonb_build_array(jsonb_build_object('stage_id',test_stage_id,'resource_id',resource_id,'order_index',0,'is_primary',true));
 perform public.save_learning_path(p,s,r,progress);
 update public.stage_progress set status='completed' where stage_progress.stage_id=test_stage_id and user_id=owner_id;
 perform public.save_learning_path(p,s,r,progress);
 if not exists(select 1 from public.stage_progress sp where sp.stage_id=test_stage_id and sp.user_id=owner_id and status='completed') then raise exception 'Retry reset progress';end if;
end $$;
select 'rollback and retry checks passed' as result,
has_function_privilege('anon','public.save_learning_path(jsonb,jsonb,jsonb,jsonb)','execute') as anon_access,
has_function_privilege('authenticated','public.save_learning_path(jsonb,jsonb,jsonb,jsonb)','execute') as user_access;

rollback;
