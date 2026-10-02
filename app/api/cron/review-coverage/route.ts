import {coverageReviewQueue} from "@/lib/paths/coverage";
export async function GET(request:Request) {
 if(!process.env.CRON_SECRET||request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return Response.json({error:"Unauthorized"},{status:401});
 const queue=coverageReviewQueue(),due=queue.filter(item=>item.status!=="current");
 if(due.length)console.warn("[cron/review-coverage] Editorial review required",{due:due.length,expired:due.filter(item=>item.status==="expired").length});
 return Response.json({reviewed:queue.length,due:due.length,items:due},{headers:{"Cache-Control":"no-store"}});
}
