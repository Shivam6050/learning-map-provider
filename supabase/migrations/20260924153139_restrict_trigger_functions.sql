-- Trigger functions are invoked by installed triggers, never by the public API.
alter function public.handle_new_user() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_role_escalation() from public, anon, authenticated;
-- Supabase may install this event trigger automatically. Do not require its presence.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke all on function public.rls_auto_enable() from public, anon, authenticated;
 end if;
end $$;
-- is_admin() intentionally remains callable by RLS policies. It returns only
-- whether auth.uid() is an admin; it cannot query another user's role.
