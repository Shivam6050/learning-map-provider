-- Resource replacement and contextual reports. Safe to rerun; existing learner data is untouched.
begin;
create table if not exists public.roadmap_resource_changes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 stage_id uuid not null references public.stages(id) on delete cascade,
 previous_resource_id uuid not null references public.resources(id) on delete restrict,
 replacement_resource_id uuid not null references public.resources(id) on delete restrict,
 created_at timestamptz not null default now()
);
create index if not exists roadmap_resource_changes_owner_date on public.roadmap_resource_changes(user_id,created_at desc);
create index if not exists roadmap_resource_changes_stage_date on public.roadmap_resource_changes(stage_id,created_at desc);
create index if not exists roadmap_resource_changes_previous on public.roadmap_resource_changes(previous_resource_id);
create index if not exists roadmap_resource_changes_replacement on public.roadmap_resource_changes(replacement_resource_id);
alter table public.roadmap_resource_changes enable row level security;
drop policy if exists resource_changes_owner_read on public.roadmap_resource_changes;
create policy resource_changes_owner_read on public.roadmap_resource_changes for select to authenticated
 using(user_id=(select auth.uid()));
revoke all on public.roadmap_resource_changes from public,anon,authenticated;
grant select on public.roadmap_resource_changes to authenticated;
grant select,insert,update,delete on public.roadmap_resource_changes to service_role;

create table if not exists public.resource_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 stage_id uuid not null references public.stages(id) on delete cascade,
 resource_id uuid not null references public.resources(id) on delete restrict,
 reason text not null check(reason in ('broken_link','wrong_price','outdated_content','difficulty_mismatch','other')),
 details text not null default '' check(char_length(details)<=1000),
 status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
 resolution text not null default '' check(char_length(resolution)<=500),
 reviewed_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
create unique index if not exists resource_reports_one_active on public.resource_reports(user_id,stage_id,resource_id,reason) where status in ('open','reviewing');
create index if not exists resource_reports_owner_resource on public.resource_reports(user_id,stage_id,resource_id,created_at desc);
create index if not exists resource_reports_owner_date on public.resource_reports(user_id,created_at desc);
create index if not exists resource_reports_queue on public.resource_reports(status,created_at desc,id);
create index if not exists resource_reports_stage on public.resource_reports(stage_id);
create index if not exists resource_reports_resource on public.resource_reports(resource_id);
create index if not exists resource_reports_reviewer on public.resource_reports(reviewed_by);
alter table public.resource_reports enable row level security;
drop policy if exists resource_reports_owner_or_admin_read on public.resource_reports;
create policy resource_reports_owner_or_admin_read on public.resource_reports for select to authenticated
 using(user_id=(select auth.uid()) or (select public.is_admin()));
revoke all on public.resource_reports from public,anon,authenticated;
grant select on public.resource_reports to authenticated;
grant select,insert,update,delete on public.resource_reports to service_role;

-- Bound the expensive provider checks before making external requests.
create table if not exists public.resource_lookup_quota (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 window_start timestamptz not null default now(),
 attempts integer not null check(attempts between 1 and 20)
);
alter table public.resource_lookup_quota enable row level security;
revoke all on public.resource_lookup_quota from public,anon,authenticated;
grant select,insert,update,delete on public.resource_lookup_quota to service_role;
create or replace function public.reserve_resource_lookup(p_user uuid) returns boolean
 language plpgsql security invoker set search_path='' as $$
declare accepted uuid;
begin
 if p_user is null then return false; end if;
 insert into public.resource_lookup_quota(user_id,window_start,attempts) values(p_user,now(),1)
 on conflict(user_id) do update set
  window_start=case when public.resource_lookup_quota.window_start<=now()-interval '10 minutes' then now() else public.resource_lookup_quota.window_start end,
  attempts=case when public.resource_lookup_quota.window_start<=now()-interval '10 minutes' then 1 else public.resource_lookup_quota.attempts+1 end
 where public.resource_lookup_quota.window_start<=now()-interval '10 minutes' or public.resource_lookup_quota.attempts<20
 returning user_id into accepted;
 return accepted is not null;
end; $$;
revoke all on function public.reserve_resource_lookup(uuid) from public,anon,authenticated;
grant execute on function public.reserve_resource_lookup(uuid) to service_role;

-- Only authenticated server actions may call these functions with a verified user ID.
-- Invoker security, empty search_path, and service-only EXECUTE keep them out of the public Auth API.
create or replace function public.replace_roadmap_resource(
 p_user uuid,p_path uuid,p_stage uuid,p_previous uuid,p_replacement uuid,p_owned boolean,
 p_weekly_hours integer,p_budget numeric,p_currency text
) returns void language plpgsql security invoker set search_path='' as $$
declare current_path public.learning_paths%rowtype;
begin
 if p_user is null or p_previous is null or p_replacement is null or p_previous=p_replacement or p_owned is null then
  raise exception 'Invalid replacement' using errcode='22023';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('resources:'||p_user::text,0));
 select * into current_path from public.learning_paths where id=p_path and user_id=p_user for update;
 if not found then raise exception 'Roadmap unavailable' using errcode='42501'; end if;
 if current_path.weekly_hours is distinct from p_weekly_hours or coalesce(current_path.budget_total,0) is distinct from p_budget or current_path.currency is distinct from p_currency then
  raise exception 'Roadmap preferences changed' using errcode='40001';
 end if;
 perform 1 from public.stage_resources sr join public.stages s on s.id=sr.stage_id
  where s.path_id=p_path and sr.stage_id=p_stage and sr.resource_id=p_previous for update of sr;
 if not found then raise exception 'Resource changed' using errcode='40001'; end if;
 perform 1 from public.resources where id=p_replacement and trust_status='allowlisted'
  and coalesce(link_status,'unchecked')<>'broken' for share;
 if not found then raise exception 'Replacement unavailable' using errcode='42501'; end if;
 if exists(select 1 from public.stage_resources where stage_id=p_stage and resource_id=p_replacement) then
  raise exception 'Already included' using errcode='23505';
 end if;
 if (select count(*) from public.roadmap_resource_changes where user_id=p_user and created_at>=now()-interval '24 hours')>=30 then
  raise exception 'Replacement limit reached' using errcode='54000';
 end if;
 update public.stage_resources set resource_id=p_replacement where stage_id=p_stage and resource_id=p_previous;
 insert into public.roadmap_resource_changes(user_id,stage_id,previous_resource_id,replacement_resource_id)
 values(p_user,p_stage,p_previous,p_replacement);
 -- Explicitly confirmed access applies to this resource everywhere in this owned roadmap.
 -- Merge the latest JSON document atomically; never overwrite notes, topic checks or completion.
 if p_owned then
  insert into public.stage_progress(stage_id,user_id,status,practice_check)
  select sr.stage_id,p_user,'not_started',jsonb_build_object('owned_resource_ids',jsonb_build_array(p_replacement::text))
   from public.stage_resources sr join public.stages s on s.id=sr.stage_id
   where s.path_id=p_path and sr.resource_id=p_replacement order by sr.stage_id
  on conflict(stage_id,user_id) do update set practice_check=jsonb_set(
   coalesce(public.stage_progress.practice_check,'{}'::jsonb),'{owned_resource_ids}',
   coalesce((select jsonb_agg(distinct entry) from jsonb_array_elements(
    (case when jsonb_typeof(public.stage_progress.practice_check->'owned_resource_ids')='array' then public.stage_progress.practice_check->'owned_resource_ids' else '[]'::jsonb end)
    ||jsonb_build_array(p_replacement::text)) entry),'[]'::jsonb));
 end if;
end; $$;
revoke all on function public.replace_roadmap_resource(uuid,uuid,uuid,uuid,uuid,boolean,integer,numeric,text) from public,anon,authenticated;
grant execute on function public.replace_roadmap_resource(uuid,uuid,uuid,uuid,uuid,boolean,integer,numeric,text) to service_role;

create or replace function public.submit_resource_report(
 p_user uuid,p_path uuid,p_stage uuid,p_resource uuid,p_reason text,p_details text
) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_user is null or p_reason is null or p_reason not in ('broken_link','wrong_price','outdated_content','difficulty_mismatch','other')
  or p_details is null or char_length(p_details)>1000 then raise exception 'Invalid report' using errcode='22023'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('resources:'||p_user::text,0));
 perform 1 from public.learning_paths where id=p_path and user_id=p_user for share;
 if not found then raise exception 'Roadmap unavailable' using errcode='42501'; end if;
 perform 1 from public.stage_resources sr join public.stages s on s.id=sr.stage_id
  where sr.stage_id=p_stage and s.path_id=p_path and sr.resource_id=p_resource for share of sr;
 if not found then raise exception 'Resource unavailable' using errcode='42501'; end if;
 if exists(select 1 from public.resource_reports where user_id=p_user and stage_id=p_stage and resource_id=p_resource and reason=p_reason and status in ('open','reviewing')) then return false; end if;
 if (select count(*) from public.resource_reports where user_id=p_user and created_at>=now()-interval '24 hours')>=20 then
  raise exception 'Report limit reached' using errcode='54000';
 end if;
 insert into public.resource_reports(user_id,stage_id,resource_id,reason,details) values(p_user,p_stage,p_resource,p_reason,btrim(p_details));
 return true;
end; $$;
revoke all on function public.submit_resource_report(uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.submit_resource_report(uuid,uuid,uuid,uuid,text,text) to service_role;

create or replace function public.review_resource_report(p_user uuid,p_report uuid,p_expected text,p_status text,p_resolution text,p_reviewed_at timestamptz)
 returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_user and role='admin') then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_status is null or p_status not in ('reviewing','resolved','dismissed') or p_resolution is null or char_length(p_resolution)>500 then
  raise exception 'Invalid review' using errcode='22023'; end if;
 update public.resource_reports set status=p_status,resolution=btrim(p_resolution),reviewed_at=clock_timestamp(),reviewed_by=p_user
  where id=p_report and status=p_expected and reviewed_at is not distinct from p_reviewed_at;
 if not found then raise exception 'Report changed' using errcode='40001'; end if;
end; $$;
revoke all on function public.review_resource_report(uuid,uuid,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.review_resource_report(uuid,uuid,text,text,text,timestamptz) to service_role;
commit;
