-- ============================================================
-- Migration 007: stage_progress.updated_at
--
-- Needed to detect "hasn't touched this path in N days" for the
-- weekly reminder cron — completed_at only fires once, on completion,
-- and doesn't track ordinary status changes (not_started -> in_progress).
-- ============================================================

alter table public.stage_progress
  add column updated_at timestamptz not null default now();

create index idx_stage_progress_updated_at on public.stage_progress(updated_at);
