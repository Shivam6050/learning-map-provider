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
