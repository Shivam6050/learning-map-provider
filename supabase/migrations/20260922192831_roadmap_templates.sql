-- Shared curriculum is accessible only through trusted server code.
create table public.roadmap_templates (
  field_slug text not null check (field_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  skill_level text not null check (skill_level in ('beginner', 'intermediate', 'advanced')),
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  stages jsonb not null check (jsonb_typeof(stages) = 'array' and jsonb_array_length(stages) between 1 and 12),
  reviewed_at timestamptz not null,
  valid_until timestamptz not null check (valid_until > reviewed_at),
  created_at timestamptz not null default now(),
  primary key (field_slug, skill_level, version)
);
alter table public.roadmap_templates enable row level security;
revoke all on public.roadmap_templates from public, anon, authenticated;
grant select, insert, update on public.roadmap_templates to service_role;
-- The primary key supports latest-version lookup within a field and level.
comment on table public.roadmap_templates is 'Versioned free curricula; server-only access. Saved user paths remain independent snapshots.';
