-- Cache statement-constant identity checks; keep owner and MFA boundaries.
-- Remove unused catalog grants without changing service-role maintenance access.
-- Safe to rerun; no learner/catalog rows are rewritten.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '15s';

alter policy learning_paths_owner_all on public.learning_paths to authenticated
 using (user_id = (select auth.uid()))
 with check (user_id = (select auth.uid()));
alter policy stages_owner_select on public.stages to authenticated
 using (exists (
  select 1 from public.learning_paths lp
  where lp.id = stages.path_id and lp.user_id = (select auth.uid())
 ));
alter policy stage_resources_owner_select on public.stage_resources to authenticated
 using (exists (
  select 1 from public.stages s join public.learning_paths lp on lp.id = s.path_id
  where s.id = stage_resources.stage_id and lp.user_id = (select auth.uid())
 ));
alter policy resource_ratings_owner_insert on public.resource_ratings to authenticated
 with check (user_id = (select auth.uid()));
alter policy resource_ratings_owner_update on public.resource_ratings to authenticated
 using (user_id = (select auth.uid()))
 with check (user_id = (select auth.uid()));

-- The database role is verified by PostgREST; no per-row auth.role() call needed.
alter policy resources_select_all on public.resources to authenticated using (true);
alter policy trusted_sources_select_all on public.trusted_sources to authenticated using (true);
-- ALL also created an overlapping SELECT policy. Keep one read policy and
-- separate admin writes; restrictive enrolled_mfa_required remains untouched.
drop policy if exists trusted_sources_admin_write on public.trusted_sources;
drop policy if exists trusted_sources_admin_insert on public.trusted_sources;
create policy trusted_sources_admin_insert on public.trusted_sources for insert to authenticated
 with check ((select public.is_admin()));
drop policy if exists trusted_sources_admin_update on public.trusted_sources;
create policy trusted_sources_admin_update on public.trusted_sources for update to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists trusted_sources_admin_delete on public.trusted_sources;
create policy trusted_sources_admin_delete on public.trusted_sources for delete to authenticated
 using ((select public.is_admin()));

-- RLS does not guard TRUNCATE. Anonymous catalog access is not used by the app;
-- public discovery runs server-side. Remove table and any old column grants.
revoke all on public.resources, public.trusted_sources from public, anon, authenticated;
do $$
declare t text; cols text;
begin
 foreach t in array array['resources','trusted_sources'] loop
  select string_agg(quote_ident(attname), ', ') into cols from pg_attribute
   where attrelid=format('public.%I',t)::regclass and attnum>0 and not attisdropped;
  execute format('revoke all (%s) on table public.%I from public, anon, authenticated',cols,t);
 end loop;
end $$;
grant select on public.resources to authenticated;
grant select, insert, update, delete on public.trusted_sources to authenticated;
commit;