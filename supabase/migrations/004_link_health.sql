-- ============================================================
-- Migration 004: link health tracking
--
-- No AI model prevents link rot — a course or video can be genuinely
-- real at discovery time and still go dead weeks later. This adds the
-- columns needed to actually check, track, and hide dead links instead
-- of trusting that "found via real search" means "still works".
-- ============================================================

alter table public.resources
  add column link_status text not null default 'unchecked'
    check (link_status in ('unchecked', 'ok', 'broken')),
  add column link_checked_at timestamptz;

create index idx_resources_link_status on public.resources(link_status);

-- Resources due for a (re)check: never checked, or checked more than
-- 14 days ago. Used by both the discovery-time check and the
-- maintenance cron (app/api/cron/check-links).
create index idx_resources_link_check_due on public.resources(link_checked_at)
  where link_status != 'broken';
