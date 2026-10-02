import {createServiceClient} from "@/lib/supabase/service";
import {verifyResourceLinks} from "@/lib/link-check/verify-resources";
import {logError} from "@/lib/monitoring/log-error";
export const maxDuration=60;
const RECHECK_AFTER_DAYS=14;
export async function GET(request:Request) {
 if(!process.env.CRON_SECRET||request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return Response.json({error:"Unauthorized"},{status:401});
 const service=createServiceClient(),started=Date.now(),deadline=started+40000;
 const cutoff=new Date(started-RECHECK_AFTER_DAYS*86400000).toISOString();
 const dueFilter=`link_checked_at.is.null,link_checked_at.lt.${cutoff}`;
 const configured=Number(process.env.MAX_LINK_CHECKS_PER_RUN??1000);
 const limit=Number.isInteger(configured)&&configured>0?Math.min(configured,5000):1000;
 let checked=0,broken=0,unknown=0;
 try {
  const {count:total,error:countError}=await service.from("resources").select("id",{count:"exact",head:true}).abortSignal(AbortSignal.timeout(3000));
  if(countError)throw new Error("Could not count link maintenance resources");
  while(Date.now()<deadline&&checked<limit){
   const {data:due,error}=await service.from("resources").select("id,url,platform")
    .or(dueFilter).order("link_checked_at",{ascending:true,nullsFirst:true}).order("id")
    .limit(Math.min(50,limit-checked)).abortSignal(AbortSignal.timeout(3000));
   if(error)throw new Error("Could not load link maintenance candidates");
   if(!due?.length)break;
   const results=await verifyResourceLinks(due,5,deadline);
   checked+=results.length;broken+=results.filter(r=>r.status==="broken").length;unknown+=results.filter(r=>r.status==="unknown").length;
   if(results.length<due.length)break;
  }
  const {count:remaining,error}=await service.from("resources").select("id",{count:"exact",head:true}).or(dueFilter).abortSignal(AbortSignal.timeout(3000));
  if(error)throw new Error("Could not measure link maintenance backlog");
  const dailyTarget=Math.ceil((total??0)/RECHECK_AFTER_DAYS);
  const capacityWarning=(remaining??0)>0&&checked<dailyTarget;
  if(capacityWarning)console.warn("[cron/check-links] Capacity below maintenance target",{checked,remaining,dailyTarget});
  return Response.json({checked,broken,unknown,remaining:remaining??0,dailyTarget,capacityWarning,incomplete:(remaining??0)>0,elapsedMs:Date.now()-started},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  await logError("cron/check-links",error);
  return Response.json({error:"Link maintenance could not finish",checked,broken,unknown,incomplete:true},{status:503});
 }
}
