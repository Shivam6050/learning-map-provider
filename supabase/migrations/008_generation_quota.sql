-- Server-only atomic daily quota. No client permissions and no security definer.
create table if not exists public.generation_quotas (
 user_id uuid primary key references auth.users(id) on delete cascade,
 day date not null,
 attempts integer not null check(attempts >= 0)
);
alter table public.generation_quotas enable row level security;
revoke all on public.generation_quotas from anon, authenticated;
grant select, insert, update on public.generation_quotas to service_role;
create or replace function public.reserve_generation(p_user_id uuid, p_limit integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare reserved integer;
begin
 if p_limit < 1 or p_limit > 1000 then raise exception 'Invalid quota'; end if;
 insert into public.generation_quotas as q (user_id, day, attempts)
 values(p_user_id, (now() at time zone 'UTC')::date, 1)
 on conflict(user_id) do update set
 day = excluded.day,
 attempts = case when q.day <> excluded.day then 1 else q.attempts + 1 end
 where q.day <> excluded.day or q.attempts < p_limit
 returning attempts into reserved;
 return reserved is not null;
end; $$;
revoke all on function public.reserve_generation(uuid, integer) from public, anon, authenticated;
grant execute on function public.reserve_generation(uuid, integer) to service_role;
