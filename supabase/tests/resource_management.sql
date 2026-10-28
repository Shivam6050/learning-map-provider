-- Local fixtures only. Execute with the migration in a transaction; always roll back.
do $$
declare u uuid:=gen_random_uuid(); stranger uuid:=gen_random_uuid(); field uuid; p uuid:=gen_random_uuid(); p2 uuid:=gen_random_uuid();
 s uuid:=gen_random_uuid(); s2 uuid:=gen_random_uuid(); old_r uuid:=gen_random_uuid(); new_r uuid:=gen_random_uuid(); bad_r uuid:=gen_random_uuid(); report_id uuid;
 prior jsonb:='{"user_submission":"Keep my notes","topic_completion":{"sql.queries":true},"milestone_completion":{"project":true},"description":"Keep practice brief"}';
begin
 insert into auth.users(id,email,raw_user_meta_data) values(u,'test-'||u||'@example.invalid','{}'),(stranger,'test-'||stranger||'@example.invalid','{}');
 select id into field from public.fields limit 1;
 insert into public.learning_paths(id,user_id,field_id,skill_level,weekly_hours,budget_total,currency)
 values(p,u,field,'beginner',10,100,'USD'),(p2,stranger,field,'beginner',10,100,'USD');
 insert into public.stages(id,path_id,title,order_index,estimated_hours) values(s,p,'Resource test',0,20),(s2,p2,'Other test',0,20);
 insert into public.resources(id,title,url,platform,resource_type,price,currency,trust_status,link_status)
 values(old_r,'Original','https://www.w3schools.com/sql/?test='||old_r,'docs','docs',0,'USD','allowlisted','ok'),
 (new_r,'Replacement','https://www.w3schools.com/sql/?test='||new_r,'docs','docs',0,'USD','allowlisted','ok'),
 (bad_r,'Untrusted','https://www.w3schools.com/sql/?test='||bad_r,'docs','docs',0,'USD','pending','ok');
 insert into public.stage_resources(stage_id,resource_id,order_index,is_primary) values(s,old_r,3,true),(s2,old_r,0,true);
 insert into public.stage_progress(stage_id,user_id,status,completed_at,practice_check) values(s,u,'completed','2026-10-01T00:00:00Z',prior);
 if not public.submit_resource_report(u,p,s,old_r,'broken_link','Test details') then raise exception 'First report not created'; end if;
 if public.submit_resource_report(u,p,s,old_r,'broken_link','Duplicate') then raise exception 'Duplicate inserted'; end if;
 perform public.submit_resource_report(stranger,p2,s2,old_r,'wrong_price','Other report');
 begin perform public.submit_resource_report(stranger,p,s,old_r,'other','Not owned'); raise exception 'Ownership bypass'; exception when insufficient_privilege then null; end;
 begin perform public.submit_resource_report(u,p,s,old_r,'other',repeat('x',1001)); raise exception 'Length bypass'; exception when invalid_parameter_value then null; end;
 begin perform public.replace_roadmap_resource(stranger,p,s,old_r,new_r,false,10,100,'USD'); raise exception 'Replacement ownership bypass'; exception when insufficient_privilege then null; end;
 begin perform public.replace_roadmap_resource(u,p,s,old_r,bad_r,false,10,100,'USD'); raise exception 'Trust bypass'; exception when insufficient_privilege then null; end;
 begin perform public.replace_roadmap_resource(u,p,s,old_r,new_r,false,11,100,'USD'); raise exception 'Stale preferences bypass'; exception when serialization_failure then null; end;
 perform public.replace_roadmap_resource(u,p,s,old_r,new_r,true,10,100,'USD');
 if not exists(select 1 from public.stage_resources where stage_id=s and resource_id=new_r and order_index=3 and is_primary) then raise exception 'Resource slot changed'; end if;
 if not exists(select 1 from public.stage_progress where stage_id=s and status='completed' and completed_at='2026-10-01T00:00:00Z' and practice_check @> prior and practice_check->'owned_resource_ids' @> jsonb_build_array(new_r::text)) then raise exception 'Learning data lost'; end if;
 if (select count(*) from public.roadmap_resource_changes where stage_id=s)<>1 then raise exception 'History missing'; end if;
 if exists(select 1 from public.stage_resources where stage_id=s2 and resource_id=new_r) then raise exception 'Other user modified'; end if;
 select id into report_id from public.resource_reports where user_id=u and stage_id=s;
 begin perform public.review_resource_report(stranger,report_id,'open','resolved','Not admin',null); raise exception 'Admin bypass'; exception when insufficient_privilege then null; end;
 for i in 1..20 loop if not public.reserve_resource_lookup(u) then raise exception 'Lookup limit too early'; end if; end loop;
 if public.reserve_resource_lookup(u) then raise exception 'Lookup limit bypass'; end if;
 update public.resource_lookup_quota set window_start=now()-interval '11 minutes' where user_id=u;
 if not public.reserve_resource_lookup(u) then raise exception 'Lookup window did not reset'; end if;
 perform set_config('learningmap.test_owner',u::text,true);perform set_config('learningmap.test_other',stranger::text,true);
 perform set_config('learningmap.test_report',report_id::text,true);
 perform set_config('learningmap.test_path',p::text,true);perform set_config('learningmap.test_stage',s::text,true);perform set_config('learningmap.test_resource',new_r::text,true);perform set_config('learningmap.test_previous',old_r::text,true);
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('learningmap.test_owner'),true);
do $$ begin
 if (select count(*) from public.resource_reports where user_id in (current_setting('learningmap.test_owner')::uuid,current_setting('learningmap.test_other')::uuid))<>1 then raise exception 'Report RLS failed'; end if;
 if (select count(*) from public.roadmap_resource_changes where user_id in (current_setting('learningmap.test_owner')::uuid,current_setting('learningmap.test_other')::uuid))<>1 then raise exception 'History RLS failed'; end if;
 if has_table_privilege('authenticated','public.resource_reports','INSERT') then raise exception 'Report write grant exposed'; end if;
 if has_table_privilege('authenticated','public.roadmap_resource_changes','INSERT') then raise exception 'History write grant exposed'; end if;
 if has_table_privilege('authenticated','public.resource_lookup_quota','SELECT') then raise exception 'Quota exposed'; end if;
 if has_function_privilege('authenticated','public.replace_roadmap_resource(uuid,uuid,uuid,uuid,uuid,boolean,integer,numeric,text)','EXECUTE') then raise exception 'Replacement RPC exposed'; end if;
 if has_function_privilege('anon','public.submit_resource_report(uuid,uuid,uuid,uuid,text,text)','EXECUTE') then raise exception 'Report RPC exposed'; end if;
end $$;
reset role;
do $$ begin
 update public.profiles set role='admin' where id=current_setting('learningmap.test_other')::uuid;
 perform public.review_resource_report(current_setting('learningmap.test_other')::uuid,current_setting('learningmap.test_report')::uuid,'open','resolved','Reviewed',null);
 if not exists(select 1 from public.resource_reports where id=current_setting('learningmap.test_report')::uuid and status='resolved') then raise exception 'Review failed'; end if;
 begin perform public.review_resource_report(current_setting('learningmap.test_other')::uuid,current_setting('learningmap.test_report')::uuid,'resolved','resolved','Stale note',null); raise exception 'Same-status review conflict bypass'; exception when serialization_failure then null; end;
 begin perform public.review_resource_report(current_setting('learningmap.test_other')::uuid,current_setting('learningmap.test_report')::uuid,'open','dismissed','Stale',null); raise exception 'Review conflict bypass'; exception when serialization_failure then null; end;
end $$;
do $$ declare u uuid:=current_setting('learningmap.test_owner')::uuid; admin_id uuid:=current_setting('learningmap.test_other')::uuid;
 p uuid:=current_setting('learningmap.test_path')::uuid; s uuid:=current_setting('learningmap.test_stage')::uuid; r uuid:=current_setting('learningmap.test_resource')::uuid; report_id uuid;
begin
 if not public.submit_resource_report(u,p,s,r,'broken_link','First issue') then raise exception 'New report rejected'; end if;
 select id into report_id from public.resource_reports where user_id=u and stage_id=s and resource_id=r;
 perform public.review_resource_report(admin_id,report_id,'open','resolved','Fixed',null);
 if not public.submit_resource_report(u,p,s,r,'broken_link','Issue returned') then raise exception 'Closed issue could not be reported again'; end if;
 if (select count(*) from public.resource_reports where user_id=u and stage_id=s and resource_id=r)<>2 then raise exception 'Previous review audit was lost'; end if;
end $$;
do $$ declare u uuid:=current_setting('learningmap.test_owner')::uuid; p uuid:=current_setting('learningmap.test_path')::uuid;
 s uuid:=current_setting('learningmap.test_stage')::uuid; current_r uuid:=current_setting('learningmap.test_resource')::uuid; previous_r uuid:=current_setting('learningmap.test_previous')::uuid; extra_stage uuid; next_r uuid; swap_r uuid;
begin
 for i in 1..17 loop
  extra_stage:=gen_random_uuid();
  insert into public.stages(id,path_id,title,order_index,estimated_hours) values(extra_stage,p,'Report limit fixture',i+10,1);
  insert into public.stage_resources(stage_id,resource_id,order_index,is_primary) values(extra_stage,current_r,0,true);
  perform public.submit_resource_report(u,p,extra_stage,current_r,'wrong_price','Limit fixture');
 end loop;
 begin perform public.submit_resource_report(u,p,s,current_r,'wrong_price','Too many'); raise exception 'Daily report limit bypass'; exception when program_limit_exceeded then null; end;
 next_r:=previous_r;
 for i in 1..29 loop
  perform public.replace_roadmap_resource(u,p,s,current_r,next_r,false,10,100,'USD');
  swap_r:=current_r;current_r:=next_r;next_r:=swap_r;
 end loop;
 begin perform public.replace_roadmap_resource(u,p,s,current_r,next_r,false,10,100,'USD'); raise exception 'Daily replacement limit bypass'; exception when program_limit_exceeded then null; end;
end $$;
rollback;
