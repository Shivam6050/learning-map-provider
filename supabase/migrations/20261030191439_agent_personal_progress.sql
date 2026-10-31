-- Optional, owner-scoped MCP access to saved roadmaps and progress.
-- Additive rollout: the existing catalog scope and legacy key-creation RPC remain compatible.
begin;

alter table public.agent_access_keys
  add column if not exists personal_read boolean not null default false,
  add column if not exists progress_write boolean not null default false;
alter table public.agent_access_keys drop constraint if exists agent_access_keys_personal_progress_check;
alter table public.agent_access_keys add constraint agent_access_keys_personal_progress_check
  check (not progress_write or personal_read);
grant select(personal_read,progress_write) on public.agent_access_keys to authenticated;

create or replace function public.create_scoped_agent_access_key(
 p_user uuid, p_label text, p_hash text,
 p_personal_read boolean default false, p_progress_write boolean default false
)
 returns uuid language plpgsql security invoker set search_path = '' as $$
declare key_id uuid;
begin
 if p_user is null
   or length(btrim(coalesce(p_label,''))) not between 1 and 80
   or p_hash is null or p_hash !~ '^[0-9a-f]{64}$'
   or p_personal_read is null or p_progress_write is null
   or (p_progress_write and not p_personal_read) then
  raise exception 'Invalid agent key' using errcode='22023';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text, 403));
 if (select count(*) from public.agent_access_keys where user_id=p_user and created_at >= now()-interval '1 day') >= 10 then
  raise exception 'Agent key daily limit reached' using errcode='P0001';
 end if;
 if (select count(*) from public.agent_access_keys where user_id=p_user and revoked_at is null and expires_at > now()) >= 5 then
  raise exception 'Agent key active limit reached' using errcode='P0001';
 end if;
 insert into public.agent_access_keys(user_id,label,token_hash,scope,personal_read,progress_write)
 values(p_user,btrim(p_label),p_hash,'catalog:read',p_personal_read,p_progress_write)
 returning id into key_id;
 return key_id;
end;
$$;
revoke all on function public.create_scoped_agent_access_key(uuid,text,text,boolean,boolean) from public, anon, authenticated;
grant execute on function public.create_scoped_agent_access_key(uuid,text,text,boolean,boolean) to service_role;

create or replace function public.update_agent_stage_progress(p_user uuid, p_path uuid, p_stage uuid, p_status text)
 returns timestamptz language plpgsql security definer set search_path = '' as $$
declare changed_at timestamptz;
begin
 if p_user is null or p_path is null or p_stage is null or p_status is null
   or p_status not in ('not_started','in_progress','completed') then
  raise exception 'Invalid progress update' using errcode='22023';
 end if;
 if not exists (
   select 1 from public.learning_paths path
   join public.stages stage on stage.path_id=path.id
   where path.id=p_path and path.user_id=p_user and stage.id=p_stage
 ) then
  raise exception 'Roadmap stage not found' using errcode='P0002';
 end if;
 insert into public.stage_progress(stage_id,user_id,status,completed_at,updated_at)
 values(p_stage,p_user,p_status,case when p_status='completed' then pg_catalog.now() else null end,pg_catalog.now())
 on conflict(stage_id,user_id) do update
 set status=excluded.status, completed_at=excluded.completed_at, updated_at=excluded.updated_at
 returning updated_at into changed_at;
 return changed_at;
end;
$$;
revoke all on function public.update_agent_stage_progress(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.update_agent_stage_progress(uuid,uuid,uuid,text) to service_role;

commit;
