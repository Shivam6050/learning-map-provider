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
security definer
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

-- PROFILES: read own row (or any row, if admin). Update own row only,
-- with role changes blocked by the trigger above. No insert policy —
-- rows are only created by the handle_new_user trigger.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

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
  on public.trusted_sources for all
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
