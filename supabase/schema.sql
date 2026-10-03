-- ============================================================
-- Learning Map Platform — Supabase Postgres Schema
-- Includes constraints + Row Level Security fixing the issues
-- flagged in review: RLS gaps, missing roles, duplicate PII,
-- rating manipulation, resource duplication, cascade rules.
-- ============================================================

create extension if not exists "uuid-ossp";

create type user_role as enum ('user', 'admin');

-- ------------------------------------------------------------
-- PROFILES
-- References auth.users instead of duplicating email — avoids
-- storing PII in a second, separately-secured table.
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'user',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
-- Client never inserts into profiles directly — no insert policy
-- is granted below, so this trigger is the only way a row appears.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, new.raw_user_meta_data->>'display_name', 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Blocks a user from promoting themselves to admin via UPDATE,
-- regardless of what the RLS with-check on the update allows.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Only admins can change user roles';
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- FIELDS
-- ------------------------------------------------------------
create table public.fields (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique
);

-- ------------------------------------------------------------
-- LEARNING_PATHS
-- Added currency for consistency with resources.price.
-- ------------------------------------------------------------
create table public.learning_paths (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  field_id uuid not null references public.fields(id) on delete restrict,
  skill_level text not null check (skill_level in ('beginner','intermediate','advanced')),
  weekly_hours integer not null check (weekly_hours > 0),
  budget_total numeric(10,2),
  currency text not null default 'USD',
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now()
);
create index idx_learning_paths_user_id on public.learning_paths(user_id);

-- ------------------------------------------------------------
-- STAGES
-- Cascade deletes with the parent path — stages don't outlive it.
-- ------------------------------------------------------------
create table public.stages (
  id uuid primary key default uuid_generate_v4(),
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  title text not null,
  order_index integer not null,
  description text,
  estimated_hours integer,
  unique (path_id, order_index)
);
create index idx_stages_path_id on public.stages(path_id);

-- ------------------------------------------------------------
-- TRUSTED_SOURCES
-- Only admins (human curators) or the backend (service role) write here.
-- ------------------------------------------------------------
create table public.trusted_sources (
  id uuid primary key default uuid_generate_v4(),
  field_id uuid not null references public.fields(id) on delete cascade,
  source_name text not null,
  source_url text,
  platform text not null,
  added_by text not null check (added_by in ('admin','ai_proposed','community')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_trusted_sources_field_id on public.trusted_sources(field_id);

-- ------------------------------------------------------------
-- RESOURCES
-- url is unique — prevents the same video/course being inserted
-- as duplicate rows and fragmenting its ratings/signals.
-- Never client-writable: only the backend (service role) or admins
-- can insert/update — see RLS section, no client write policy exists.
-- ------------------------------------------------------------
create table public.resources (
  id uuid primary key default uuid_generate_v4(),
  trusted_source_id uuid references public.trusted_sources(id) on delete set null,
  title text not null,
  url text not null unique,
  platform text not null,
  resource_type text not null check (resource_type in ('video','course','article','docs')),
  price numeric(10,2) default 0,
  currency text default 'USD',
  rating numeric(3,2),
  trust_status text not null default 'pending' check (trust_status in ('allowlisted','pending','rejected')),
  last_verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_resources_trust_status on public.resources(trust_status);

-- ------------------------------------------------------------
-- STAGE_RESOURCES (join table)
-- restrict on resource_id delete — a shared resource can't be
-- deleted out from under stages still referencing it.
-- ------------------------------------------------------------
create table public.stage_resources (
  id uuid primary key default uuid_generate_v4(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete restrict,
  order_index integer not null default 0,
  is_primary boolean not null default false,
  unique (stage_id, resource_id)
);
create index idx_stage_resources_stage_id on public.stage_resources(stage_id);
create index idx_stage_resources_resource_id on public.stage_resources(resource_id);

-- ------------------------------------------------------------
-- STAGE_PROGRESS
-- unique(stage_id, user_id) — one progress record per user per stage.
-- user_id is never trusted from client input; RLS forces it to
-- equal auth.uid() on every write (see policy below).
-- ------------------------------------------------------------
create table public.stage_progress (
  id uuid primary key default uuid_generate_v4(),
  stage_id uuid not null references public.stages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  completed_at timestamptz,
  practice_check jsonb,
  unique (stage_id, user_id)
);
create index idx_stage_progress_user_id on public.stage_progress(user_id);

-- ------------------------------------------------------------
-- RESOURCE_RATINGS
-- unique(resource_id, user_id) — stops one user inflating/deflating
-- a resource's score with repeated ratings.
-- ------------------------------------------------------------
create table public.resource_ratings (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (resource_id, user_id)
);
create index idx_resource_ratings_resource_id on public.resource_ratings(resource_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.learning_paths enable row level security;
alter table public.stages enable row level security;
alter table public.trusted_sources enable row level security;
alter table public.resources enable row level security;
alter table public.stage_resources enable row level security;
alter table public.stage_progress enable row level security;
alter table public.resource_ratings enable row level security;

-- Helper used throughout: is the current authenticated user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security invoker
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- PROFILES: owner-only, including administrators. Profile creation and
-- privileged account management stay on the trusted backend.
create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update(display_name) on public.profiles to authenticated;
-- The private_user_boundaries migration adds avatar_id and other table grants.

-- LEARNING_PATHS: strictly owner-only for every operation.
create policy "learning_paths_owner_all"
  on public.learning_paths for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- STAGES: readable only if you own the parent path. No client write
-- policy — stages are generated by the backend (service role) during
-- the AI curation pipeline, never inserted directly by the client.
create policy "stages_owner_select"
  on public.stages for select
  using (
    exists (
      select 1 from public.learning_paths lp
      where lp.id = stages.path_id and lp.user_id = auth.uid()
    )
  );

-- RESOURCES: readable by any authenticated user. No insert/update/delete
-- policy exists for the authenticated role at all — writes only happen
-- via the backend's service-role key, which bypasses RLS entirely.
create policy "resources_select_all"
  on public.resources for select
  using (auth.role() = 'authenticated');

-- TRUSTED_SOURCES: readable by all; writable only by admins.
create policy "trusted_sources_select_all"
  on public.trusted_sources for select
  using (auth.role() = 'authenticated');

create policy "trusted_sources_admin_write"
  on public.trusted_sources for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- STAGE_RESOURCES: readable only if you own the parent stage's path.
create policy "stage_resources_owner_select"
  on public.stage_resources for select
  using (
    exists (
      select 1 from public.stages s
      join public.learning_paths lp on lp.id = s.path_id
      where s.id = stage_resources.stage_id and lp.user_id = auth.uid()
    )
  );

-- STAGE_PROGRESS: strictly owner-only. with check forces user_id to
-- equal auth.uid() on every insert/update — a spoofed user_id in the
-- request body is rejected by Postgres, not just ignored by the app.
create policy "stage_progress_owner_all"
  on public.stage_progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- RESOURCE_RATINGS: anyone can read; a user can only insert/update
-- their own rating (the unique constraint above stops duplicates).
create policy "resource_ratings_select_all"
  on public.resource_ratings for select
  using (auth.role() = 'authenticated');

create policy "resource_ratings_owner_insert"
  on public.resource_ratings for insert
  with check (user_id = auth.uid());

create policy "resource_ratings_owner_update"
  on public.resource_ratings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Atomic rating write contract (also shipped as a migration).
-- Ratings are written only by the authenticated server action through service_role.
-- SECURITY INVOKER avoids a privileged publicly callable function.
begin;
create or replace function public.save_roadmap_rating(
 p_user uuid, p_path uuid, p_resource uuid, p_rating integer
) returns numeric
language plpgsql security invoker set search_path = ''
as $$
declare result numeric;
begin
 if p_user is null or p_rating is null or p_rating not between 1 and 5 then
  raise exception 'Invalid rating' using errcode = '22023';
 end if;
 -- Lock the owned parent against deletion while validating its course membership.
 perform 1 from public.learning_paths where id=p_path and user_id=p_user for share;
 if not found then raise exception 'Roadmap unavailable' using errcode = '42501'; end if;
 perform 1 from public.stage_resources sr join public.stages s on s.id=sr.stage_id
  where s.path_id=p_path and sr.resource_id=p_resource;
 if not found then raise exception 'Course unavailable' using errcode = '42501'; end if;
 -- Serialize votes BEFORE the upsert, so the following aggregate sees all
 -- previously committed votes and this transaction's vote under READ COMMITTED.
 perform 1 from public.resources where id=p_resource for update;
 if not found then raise exception 'Course unavailable' using errcode = '42501'; end if;
 insert into public.resource_ratings(resource_id,user_id,rating)
 values(p_resource,p_user,p_rating)
 on conflict(resource_id,user_id) do update set rating=excluded.rating;
 select round(avg(rating),2) into result from public.resource_ratings where resource_id=p_resource;
 update public.resources set rating=result where id=p_resource;
 return result;
end;
$$;
revoke all on function public.save_roadmap_rating(uuid,uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.save_roadmap_rating(uuid,uuid,uuid,integer) to service_role;
-- Otherwise direct Data API writes could bypass the membership and lock protocol.
revoke insert, update, delete on public.resource_ratings from anon, authenticated;
grant select, insert, update, delete on public.resource_ratings to service_role;
commit;
