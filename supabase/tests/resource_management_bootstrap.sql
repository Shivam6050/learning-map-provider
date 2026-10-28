-- Isolated PGlite/Postgres test harness: minimal pre-existing LearningMap schema.
-- Not a deployment migration. Never run against a hosted project.
create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to authenticated;
grant execute on function auth.uid() to authenticated;
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,role text not null default 'user');
create function public.test_create_profile() returns trigger language plpgsql as $$begin insert into public.profiles(id) values(new.id);return new;end$$;
create trigger test_profile after insert on auth.users for each row execute function public.test_create_profile();
alter table public.profiles enable row level security;
create policy owner_read on public.profiles for select to authenticated using(id=(select auth.uid()));
grant select on public.profiles to authenticated;
create function public.is_admin() returns boolean language sql security invoker stable set search_path='' as $$select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin')$$;
create table public.fields(id uuid primary key default gen_random_uuid());insert into public.fields default values;
create table public.learning_paths(id uuid primary key,user_id uuid references public.profiles(id),field_id uuid references public.fields(id),skill_level text,weekly_hours integer,budget_total numeric(10,2),currency text);
create table public.stages(id uuid primary key,path_id uuid references public.learning_paths(id) on delete cascade,title text,order_index integer,estimated_hours integer);
create table public.resources(id uuid primary key,title text,url text unique,platform text,resource_type text,price numeric,currency text,trust_status text,link_status text);
create table public.stage_resources(id uuid primary key default gen_random_uuid(),stage_id uuid references public.stages(id) on delete cascade,resource_id uuid references public.resources(id),order_index integer,is_primary boolean,unique(stage_id,resource_id));
create table public.stage_progress(id uuid primary key default gen_random_uuid(),stage_id uuid references public.stages(id) on delete cascade,user_id uuid references public.profiles(id),status text,completed_at timestamptz,practice_check jsonb,unique(stage_id,user_id));
grant all on all tables in schema public to service_role;
