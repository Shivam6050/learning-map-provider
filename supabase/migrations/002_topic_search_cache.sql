-- ============================================================
-- Phase 2 migration: topic search cache
-- ============================================================

create table if not exists public.topic_search_cache (
  id uuid primary key default uuid_generate_v4(),
  topic_key text not null,
  platform text not null check (platform in ('youtube', 'web')),
  resource_ids uuid[] not null default '{}',
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  unique (topic_key, platform)
);

alter table public.topic_search_cache enable row level security;

alter table public.resources
  add column if not exists signals jsonb not null default '{}'::jsonb;
