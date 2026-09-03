-- ============================================================
-- Migration 005: profile avatars
-- ============================================================

alter table public.profiles
  add column avatar_id text not null default 'fox';

-- Picked up by the handle_new_user trigger below (replaces the version
-- from schema.sql to also copy avatar_id from signup metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, display_name, avatar_id, role)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    coalesce(new.raw_user_meta_data->>'avatar_id', 'fox'),
    'user'
  );
  return new;
end;
$$;
