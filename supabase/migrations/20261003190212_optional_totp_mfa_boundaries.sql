-- Optional MFA: no verified factor -> existing owner access; verified factor -> AAL2.
-- The check reads live factor status, so old AAL1 JWTs cannot bypass enrollment.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create or replace function private.mfa_session_allowed()
 returns boolean language sql stable security definer set search_path = '' as $$
 select (select auth.uid()) is not null and (
  coalesce((select auth.jwt())->>'aal','aal1') = 'aal2'
  or not exists (
   select 1 from auth.mfa_factors
   where user_id=(select auth.uid()) and status='verified'
  )
 );
$$;
revoke all on function private.mfa_session_allowed() from public, anon, authenticated;
grant execute on function private.mfa_session_allowed() to authenticated;
-- These RESTRICTIVE policies are ANDed with existing owner policies.
do $$
declare t text;
begin
 foreach t in array array['profiles','learning_paths','stages','stage_resources',
  'stage_progress','resource_ratings','pending_path_sets','agent_access_keys','trusted_sources'] loop
  execute format('drop policy if exists enrolled_mfa_required on public.%I',t);
  execute format(
   'create policy enrolled_mfa_required on public.%I as restrictive for all to authenticated using ((select private.mfa_session_allowed())) with check ((select private.mfa_session_allowed()))',t);
 end loop;
end;
$$;
commit;
