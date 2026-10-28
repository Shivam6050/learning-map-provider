-- LOCAL test extension to resource_management_bootstrap.sql. Never run hosted.
alter table public.profiles add column display_name text;
create or replace function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
 nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
$$;
create function auth.jwt() returns jsonb language sql stable as $$select nullif(current_setting('request.jwt.claims',true),'')::jsonb$$;
create function auth.role() returns text language sql stable as $$select auth.jwt()->>'role'$$;
create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users(id),factor_type text,status text,created_at timestamptz,updated_at timestamptz,secret text);
create table public.pending_path_sets(id uuid primary key);
create table public.agent_access_keys(id uuid primary key);
create table public.trusted_sources(id uuid primary key default gen_random_uuid(),source_name text);
create table public.resource_ratings(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(id),resource_id uuid references public.resources(id),rating integer);
-- Production policies captured before the optimization, including private read rules.
alter table public.learning_paths enable row level security;
alter table public.stages enable row level security;
alter table public.stage_resources enable row level security;
alter table public.resource_ratings enable row level security;
alter table public.resources enable row level security;
alter table public.trusted_sources enable row level security;
create policy learning_paths_owner_all on public.learning_paths for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy stages_owner_select on public.stages for select using(exists(select 1 from public.learning_paths lp where lp.id=stages.path_id and lp.user_id=auth.uid()));
create policy stage_resources_owner_select on public.stage_resources for select using(exists(select 1 from public.stages s join public.learning_paths lp on lp.id=s.path_id where s.id=stage_resources.stage_id and lp.user_id=auth.uid()));
create policy resources_select_all on public.resources for select using(auth.role()='authenticated');
create policy trusted_sources_select_all on public.trusted_sources for select using(auth.role()='authenticated');
create policy trusted_sources_admin_write on public.trusted_sources for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy resource_ratings_owner_insert on public.resource_ratings for insert with check(user_id=auth.uid());
create policy resource_ratings_owner_update on public.resource_ratings for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy resource_ratings_select_own on public.resource_ratings for select to authenticated using(user_id=(select auth.uid()));
grant usage on schema public,auth to anon,service_role;
grant select,insert,update,delete on public.learning_paths to authenticated;
grant select on public.stages,public.stage_resources,public.resource_ratings to authenticated;
grant all on public.resources,public.trusted_sources to anon,authenticated,service_role;
-- Include an inherited column grant to ensure the migration removes that too.
grant update(title) on public.resources to public;
insert into auth.users(id) values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');
update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000003';
insert into auth.mfa_factors(id,user_id,status) values
 ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001','verified'),
 ('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000003','verified');
insert into public.learning_paths(id,user_id,weekly_hours,budget_total,currency) values
 ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001',10,5000,'INR'),
 ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000002',5,100,'USD');
insert into public.stages(id,path_id) values
 ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000011'),
 ('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000012');
insert into public.resources(id,title) values('00000000-0000-0000-0000-000000000040','Resource');
insert into public.stage_resources(stage_id,resource_id) values
 ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000040'),
 ('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000040');
insert into public.resource_ratings(user_id,resource_id,rating) values
 ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000040',5),
 ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000040',4);
insert into public.trusted_sources(source_name) values('Reviewed provider');