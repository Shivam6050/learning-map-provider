import {publishRoadmapTemplates} from "@/lib/templates/publish";
import {logError} from "@/lib/monitoring/log-error";
export const maxDuration=60;
export async function GET(request:Request) {
 if(!process.env.CRON_SECRET || request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return Response.json({error:"Unauthorized"},{status:401});
 try {await publishRoadmapTemplates(true);return Response.json({status:"published"});}
 catch(error){await logError("templates/refresh",error);return Response.json({error:"Template refresh failed; existing templates retained"},{status:503});}
}
