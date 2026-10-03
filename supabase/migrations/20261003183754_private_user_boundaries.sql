-- Owner-only personal data; retain service-role jobs and catalog access.
-- Safe to rerun. No user records are modified.
begin;
alter table public.profiles enable row level security;
drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
 using (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
 using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Remove table AND column grants, including inherited PUBLIC access.
-- Regrant only operations used by owner-facing features below.
do $$
declare t text; cols text;
begin
 foreach t in array array[
  'profiles','learning_paths','stages','stage_resources','stage_progress',
  'resource_ratings','pending_path_sets','agent_access_keys',
  'generation_quotas','generation_global_quota','reminder_deliveries','reminder_scan_cursor'
 ] loop
  execute format('revoke all on table public.%I from public, anon, authenticated', t);
  select string_agg(quote_ident(attname), ', ') into cols
   from pg_attribute where attrelid=format('public.%I', t)::regclass
    and attnum > 0 and not attisdropped;
  execute format('revoke all (%s) on table public.%I from public, anon, authenticated', cols, t);
 end loop;
end;
$$;

grant select on public.profiles to authenticated;
-- Role, identity and creation time are never client-editable, even for admins.
grant update(display_name, avatar_id) on public.profiles to authenticated;
grant select, insert, update, delete on public.learning_paths, public.stage_progress to authenticated;
grant select on public.stages, public.stage_resources, public.resource_ratings, public.pending_path_sets to authenticated;
-- Never expose the stored credential hash.
grant select(id, user_id, label, scope, created_at, expires_at, revoked_at)
 on public.agent_access_keys to authenticated;
-- This lookup reads only the caller's own profile. It no longer needs to bypass RLS.
alter function public.is_admin() security invoker;
alter function public.is_admin() set search_path = '';
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated, service_role;
-- Only signed-in curators can use this policy; visitors never call the helper.
drop policy if exists trusted_sources_admin_write on public.trusted_sources;
create policy trusted_sources_admin_write on public.trusted_sources for all to authenticated
 using (public.is_admin()) with check (public.is_admin());
commit;
