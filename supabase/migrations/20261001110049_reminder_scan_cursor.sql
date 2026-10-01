-- Service-only weekly scan checkpoints. Delivery claims remain the send deduplication boundary.
create table if not exists public.reminder_scan_cursor (
 period date primary key,
 last_path_id uuid,
 completed boolean not null default false
);
alter table public.reminder_scan_cursor enable row level security;
revoke all on public.reminder_scan_cursor from public, anon, authenticated;
grant select, insert, update on public.reminder_scan_cursor to service_role;
create or replace function public.advance_reminder_scan(p_period date, p_path uuid, p_completed boolean default false)
returns void language sql security invoker set search_path = '' as $$
 insert into public.reminder_scan_cursor(period,last_path_id,completed) values(p_period,p_path,p_completed)
 on conflict(period) do update set
 last_path_id = greatest(public.reminder_scan_cursor.last_path_id,excluded.last_path_id),
 completed = public.reminder_scan_cursor.completed or excluded.completed;
$$;
revoke all on function public.advance_reminder_scan(date,uuid,boolean) from public,anon,authenticated;
grant execute on function public.advance_reminder_scan(date,uuid,boolean) to service_role;
