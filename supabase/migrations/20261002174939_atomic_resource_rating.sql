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
