-- ============================================================
-- Migration 006: exchange rate cache
--
-- Backend-only, same pattern as topic_search_cache: no RLS policies
-- granted, so only the service-role client can read/write it.
-- ============================================================

create table public.exchange_rates (
  base_currency text primary key,
  rates jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.exchange_rates enable row level security;
-- No policies — deny-all for anon/authenticated, service role bypasses RLS.
