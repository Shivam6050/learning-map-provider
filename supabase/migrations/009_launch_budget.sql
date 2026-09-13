-- Apply after 008. Limits count attempts, including failed provider work.
create table public.generation_global_quota (
 id boolean primary key default true check (id),
 day date not null,
 attempts integer not null default 0 check(attempts >= 0)
);
alter table public.generation_global_quota enable row level security;
revoke all on public.generation_global_quota from anon, authenticated;
grant select, insert, update on public.generation_global_quota to service_role;
create or replace function public.reserve_launch_generation(p_user_id uuid, p_user_limit integer, p_global_limit integer)
returns text language plpgsql security invoker set search_path = '' as $$
declare today date := (now() at time zone 'UTC')::date; used integer;
begin
 if p_user_id is null or p_user_limit is null or p_global_limit is null or p_user_limit not between 1 and 100 or p_global_limit not between 1 and 1000 then raise exception 'Invalid quota'; end if;
 insert into public.generation_global_quota(id, day, attempts) values(true,today,0) on conflict(id) do nothing;
 select attempts into used from public.generation_global_quota where id = true for update;
 update public.generation_global_quota set day=today, attempts=0 where id=true and day<>today;
 select attempts into used from public.generation_global_quota where id=true;
 if used >= p_global_limit then return 'global_limit'; end if;
 if not public.reserve_generation(p_user_id,p_user_limit) then return 'user_limit'; end if;
 update public.generation_global_quota set attempts=attempts+1 where id=true;
 return 'allowed';
end; $$;
revoke all on function public.reserve_launch_generation(uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.reserve_launch_generation(uuid,integer,integer) to service_role;
