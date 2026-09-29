create table if not exists public.reminder_deliveries (
 user_id uuid not null references public.profiles(id) on delete cascade,
 period date not null,
 status text not null default 'claimed' check(status in ('claimed','sent','uncertain')),
 created_at timestamptz not null default now(),
 primary key(user_id,period)
);
alter table public.reminder_deliveries enable row level security;
revoke all on public.reminder_deliveries from anon, authenticated;
grant select,insert,update,delete on public.reminder_deliveries to service_role;
