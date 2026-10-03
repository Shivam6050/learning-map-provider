-- Scoped agent keys: only hashes persist; only authenticated server actions issue/revoke.
begin;
create table if not exists public.agent_access_keys (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 label text not null check (length(btrim(label)) between 1 and 80),
 token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
 scope text not null default 'catalog:read' check (scope = 'catalog:read'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now() + interval '30 days'),
 revoked_at timestamptz,
 check (expires_at > created_at and expires_at <= created_at + interval '31 days')
);
create index if not exists agent_access_keys_owner_created on public.agent_access_keys(user_id, created_at desc);
alter table public.agent_access_keys enable row level security;
drop policy if exists agent_access_keys_owner_read on public.agent_access_keys;
create policy agent_access_keys_owner_read on public.agent_access_keys for select to authenticated
 using (user_id = (select auth.uid()));
revoke all on public.agent_access_keys from public, anon, authenticated;
-- Owners can list metadata, never credential hashes or directly write/reassign keys.
grant select(id, user_id, label, scope, created_at, expires_at, revoked_at) on public.agent_access_keys to authenticated;
grant select, insert, update, delete on public.agent_access_keys to service_role;

create or replace function public.create_agent_access_key(p_user uuid, p_label text, p_hash text)
 returns uuid language plpgsql security invoker set search_path = '' as $$
declare key_id uuid;
begin
 if p_user is null or length(btrim(coalesce(p_label,''))) not between 1 and 80 or p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then
  raise exception 'Invalid agent key' using errcode='22023';
 end if;
 -- Serialize creation per owner so concurrent requests cannot bypass either cap.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text, 403));
 if (select count(*) from public.agent_access_keys where user_id=p_user and created_at >= now()-interval '1 day') >= 10 then
  raise exception 'Agent key daily limit reached' using errcode='P0001';
 end if;
 if (select count(*) from public.agent_access_keys where user_id=p_user and revoked_at is null and expires_at > now()) >= 5 then
  raise exception 'Agent key active limit reached' using errcode='P0001';
 end if;
 insert into public.agent_access_keys(user_id,label,token_hash) values(p_user,btrim(p_label),p_hash) returning id into key_id;
 return key_id;
end;
$$;
revoke all on function public.create_agent_access_key(uuid,text,text) from public, anon, authenticated;
grant execute on function public.create_agent_access_key(uuid,text,text) to service_role;
commit;
