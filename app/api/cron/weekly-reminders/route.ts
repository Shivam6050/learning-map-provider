import {createServiceClient} from "@/lib/supabase/service";
import {sendEmail,emailDeliveryConfigured} from "@/lib/email/send";
import {getSiteUrl} from "@/lib/site";
export const maxDuration=60;
type Path={id:string;user_id:string;created_at:string;fields:{name:string}|{name:string}[]|null;stages:{stage_progress:{status:string;updated_at:string}[]}[]};
function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));}
export async function GET(request:Request) {
 if(!process.env.CRON_SECRET || request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return Response.json({error:"Unauthorized"},{status:401});
 if(!emailDeliveryConfigured())return Response.json({error:"Email delivery is not configured"},{status:503});
 const client=createServiceClient();const cutoff=Date.now()-7*86400000;
 const week=new Date();week.setUTCDate(week.getUTCDate()-((week.getUTCDay()+6)%7));const period=week.toISOString().slice(0,10);
 const {data:checkpoint,error:checkpointError}=await client.from("reminder_scan_cursor").select("last_path_id,completed").eq("period",period).maybeSingle();
 if(checkpointError)return Response.json({error:"Reminder checkpoints unavailable"},{status:503});
 if(checkpoint?.completed)return Response.json({sent:0,claimed:0,uncertain:0,incomplete:false});
 let cursor:string|null=checkpoint?.last_path_id ?? null;
 let sent=0,claimed=0,uncertain=0;const started=Date.now();
 async function advance(pathId:string|null,completed=false){
  const {error}=await client.rpc("advance_reminder_scan",{p_period:period,p_path:pathId,p_completed:completed});
  if(error)throw new Error("Could not save reminder checkpoint");
  cursor=pathId;
 }
 while(Date.now()-started<45000){
  let query=client.from("learning_paths").select("id,user_id,created_at,fields(name),stages(stage_progress(status,updated_at))").eq("status","active").order("id").limit(100);
  if(cursor)query=query.gt("id",cursor);
  const {data,error}=await query.abortSignal(AbortSignal.timeout(5000));
  if(error)return Response.json({error:"Could not load reminder candidates"},{status:503});
  const paths=(data??[]) as unknown as Path[];
  for(const path of paths){
   if(Date.now()-started>=45000)return Response.json({sent,claimed,uncertain,incomplete:true},{status:503});
   try {
   if(!path.stages.length || path.stages.every(s=>s.stage_progress[0]?.status==="completed")){await advance(path.id);continue;}
   const latest=Math.max(Date.parse(path.created_at),...path.stages.flatMap(s=>s.stage_progress.map(p=>Date.parse(p.updated_at)||0)));
   if(latest>=cutoff){await advance(path.id);continue;}
   const {data:userData,error:userError}=await client.auth.admin.getUserById(path.user_id);
   if(userError)throw new Error("Could not load reminder recipient");
   if(!userData.user?.email || !userData.user.email_confirmed_at || userData.user.user_metadata?.weekly_reminders===false){await advance(path.id);continue;}
   // A durable claim suppresses concurrent runs and uncertain email outcomes.
   const {error:claimError}=await client.from("reminder_deliveries").insert({user_id:path.user_id,period});
   if(claimError?.code==="23505"){await advance(path.id);continue;}
   if(claimError)return Response.json({error:"Reminder delivery storage unavailable"},{status:503});
   claimed++;
   const field=Array.isArray(path.fields)?path.fields[0]:path.fields;
   const ok=await sendEmail({to:userData.user.email,subject:"Your learning path is waiting",idempotencyKey:`learning-reminder/${path.user_id}/${period}`,html:`<p>Your ${escapeHtml(field?.name || "learning")} path is ready when you are.</p><p><a href="${getSiteUrl()}/paths/${path.id}">Continue learning</a></p><p><a href="${getSiteUrl()}/settings">Manage reminders in settings</a></p>`});
   const {error:deliveryError}=await client.from("reminder_deliveries").update({status:ok?"sent":"uncertain"}).eq("user_id",path.user_id).eq("period",period);
   if(deliveryError)console.error("[reminders] Delivery status could not be recorded");
   if(ok)sent++;else uncertain++;
   } catch { return Response.json({sent,claimed,uncertain,incomplete:true},{status:503}); }
   await advance(path.id);
  }
  if(paths.length<100){await advance(cursor,true);return Response.json({sent,claimed,uncertain,incomplete:false},{status:uncertain ? 503 : 200});}

 }
 return Response.json({sent,claimed,uncertain,incomplete:true},{status:503});
}
