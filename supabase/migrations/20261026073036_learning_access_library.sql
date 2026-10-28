-- Private, self-reported course/subscription access. No purchase or provider verification implied.
begin;
set local lock_timeout='5s';
create table if not exists public.learning_access (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 access_type text not null check(access_type in ('course','subscription')),
 resource_id uuid references public.resources(id) on delete cascade,
 subscription_key text,
 expires_on date check(expires_on between date '2000-01-01' and date '2099-12-31'),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default clock_timestamp(),
 check((access_type='course' and resource_id is not null and subscription_key is null)
  or (access_type='subscription' and resource_id is null and subscription_key is not null and subscription_key='scrimba-pro' and expires_on is not null))
);
create index if not exists learning_access_owner_date on public.learning_access(user_id,created_at desc);
create index if not exists learning_access_resource on public.learning_access(resource_id);
create unique index if not exists learning_access_one_course on public.learning_access(user_id,resource_id) where access_type='course';
create unique index if not exists learning_access_one_subscription on public.learning_access(user_id,subscription_key) where access_type='subscription';
alter table public.learning_access enable row level security;
drop policy if exists learning_access_owner_read on public.learning_access;
create policy learning_access_owner_read on public.learning_access for select to authenticated
 using(user_id=(select auth.uid()));
drop policy if exists enrolled_mfa_required on public.learning_access;
create policy enrolled_mfa_required on public.learning_access as restrictive for all to authenticated
 using((select private.mfa_session_allowed())) with check((select private.mfa_session_allowed()));
revoke all on public.learning_access from public,anon,authenticated;
grant select on public.learning_access to authenticated;
grant select,insert,update,delete on public.learning_access to service_role;

create or replace function public.save_learning_access(
 p_user uuid,p_id uuid,p_resource uuid,p_subscription text,p_expires date,p_active boolean,p_version timestamptz
) returns uuid language plpgsql security invoker set search_path='' as $$
declare saved_id uuid;
begin
 if p_user is null or p_active is null or (p_resource is null)=(p_subscription is null)
  or (p_subscription is not null and (p_subscription<>'scrimba-pro' or p_expires is null))
  or (p_expires is not null and (p_expires<date '2000-01-01' or p_expires>date '2099-12-31')) then
  raise exception 'Invalid access entry' using errcode='22023';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('library:'||p_user::text,0));
 if p_id is null then
  if p_active is not true or p_version is not null then raise exception 'Invalid new access entry' using errcode='22023'; end if;
  if (select count(*) from public.learning_access where user_id=p_user)>=200 then raise exception 'Library limit reached' using errcode='54000'; end if;
  if p_resource is not null then
   perform 1 from public.resources where id=p_resource and trust_status='allowlisted' and coalesce(link_status,'unchecked')<>'broken' and resource_type='course' for share;
   if not found then raise exception 'Course unavailable' using errcode='42501'; end if;
  end if;
  insert into public.learning_access(user_id,access_type,resource_id,subscription_key,expires_on)
   values(p_user,case when p_resource is null then 'subscription' else 'course' end,p_resource,p_subscription,p_expires) returning id into saved_id;
 else
  update public.learning_access set expires_on=p_expires,active=p_active,updated_at=clock_timestamp()
   where id=p_id and user_id=p_user and updated_at=p_version
   and resource_id is not distinct from p_resource and subscription_key is not distinct from p_subscription
   returning id into saved_id;
  if not found then raise exception 'Access entry changed or unavailable' using errcode='40001'; end if;
 end if;
 return saved_id;
end $$;
revoke all on function public.save_learning_access(uuid,uuid,uuid,text,date,boolean,timestamptz) from public,anon,authenticated;
grant execute on function public.save_learning_access(uuid,uuid,uuid,text,date,boolean,timestamptz) to service_role;
commit;