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

-- Isolated, rolled-back fixtures; no existing user records are modified.
do $$
declare u uuid:=gen_random_uuid(); v uuid:=gen_random_uuid(); f uuid:=gen_random_uuid();
 p uuid:=gen_random_uuid(); q uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); r uuid:=gen_random_uuid();
 result numeric;
begin
 insert into auth.users(id) values(u),(v);
 insert into public.profiles(id) values(u),(v) on conflict(id) do nothing;
 insert into public.fields(id,name,slug) values(f,'Rating QA '||f,'rating-qa-'||f);
 insert into public.learning_paths(id,user_id,field_id,skill_level,weekly_hours) values(p,u,f,'beginner',5),(q,v,f,'beginner',5);
 insert into public.stages(id,path_id,title,order_index) values(s,p,'QA',1);
 insert into public.resources(id,title,url,platform,resource_type) values(r,'QA','https://example.com/rating-qa/'||r,'docs','docs');
 insert into public.stage_resources(stage_id,resource_id) values(s,r);
 result:=public.save_roadmap_rating(u,p,r,5);
 if result<>5 then raise exception 'Wrong initial average'; end if;
 result:=public.save_roadmap_rating(u,p,r,2);
 if result<>2 then raise exception 'Repeated votes not replaced'; end if;
 begin perform public.save_roadmap_rating(v,p,r,4); raise exception 'Ownership check failed'; exception when insufficient_privilege then null; end;
 begin perform public.save_roadmap_rating(v,q,r,4); raise exception 'Membership check failed'; exception when insufficient_privilege then null; end;
 begin perform public.save_roadmap_rating(u,p,r,6); raise exception 'Range check failed'; exception when invalid_parameter_value then null; end;
 insert into public.stages(path_id,title,order_index) values(q,'QA second owner',1) returning id into s;
 insert into public.stage_resources(stage_id,resource_id) values(s,r);
 result:=public.save_roadmap_rating(v,q,r,4);
 if result<>3 or (select rating from public.resources where id=r)<>3 then raise exception 'Shared average incorrect'; end if;
 if has_function_privilege('authenticated','public.save_roadmap_rating(uuid,uuid,uuid,integer)','execute') then raise exception 'Public execution allowed'; end if;
 if has_table_privilege('authenticated','public.resource_ratings','insert') then raise exception 'Direct vote bypass allowed'; end if;
 if not has_function_privilege('service_role','public.save_roadmap_rating(uuid,uuid,uuid,integer)','execute') then raise exception 'Service access missing'; end if;
end $$;
select 'rating transaction and permissions passed' as verification;
rollback;
