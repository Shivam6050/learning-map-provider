import {cookies} from "next/headers";
import {createClient} from "@/lib/supabase/server";
import {getLearningUser} from "@/lib/auth/learning-user";
import {getRequestOrigin} from "@/lib/site";
import {requireUuid} from "@/lib/security/validation";
import {calendarConfigured,sameOrigin,TOKEN_COOKIE,openCalendar,type CalendarToken} from "@/lib/calendar/google-session";
import {googleEvents,insertGoogleEvent} from "@/lib/calendar/google-events";
export const maxDuration=60;
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET() {
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 const token=openCalendar<CalendarToken>((await cookies()).get(TOKEN_COOKIE)?.value);
 return reply({configured:calendarConfigured(),connected:Boolean(user && token?.userId===user.id)});
}
export async function DELETE(request:Request) {
 if(!sameOrigin(request,getRequestOrigin(request)))return reply({error:"Invalid request origin"},403);
 (await cookies()).delete(TOKEN_COOKIE);return reply({disconnected:true});
}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
 if(!sameOrigin(request,getRequestOrigin(request)))return reply({error:"Invalid request origin"},403);
 const {id}=await params;try{requireUuid(id);}catch{return reply({error:"Invalid roadmap"},400);}
 const client=await createClient();const {data:{user}}=await getLearningUser(client);
 if(!user)return reply({error:"Sign in again before importing your schedule."},401);
 const token=openCalendar<CalendarToken>((await cookies()).get(TOKEN_COOKIE)?.value);
 if(!token || typeof token.accessToken!=="string" || !token.accessToken || token.userId!==user.id)return reply({error:"Connect Google Calendar to continue."},401);
 let input;try{const text=await request.text();if(text.length>2048)throw new Error();input=JSON.parse(text);}catch{return reply({error:"Invalid schedule"},400);}
 if(!input || typeof input!=="object" || Array.isArray(input))return reply({error:"Invalid schedule"},400);
 const offset=input.offset ?? 0;
 if(!Number.isInteger(offset)||offset<0||offset>10000||typeof input.date!=="string"||typeof input.time!=="string"||!Array.isArray(input.days)||typeof input.timeZone!=="string")return reply({error:"Invalid schedule"},400);
 const {data:path,error:pathError}=await client.from("learning_paths").select("id,weekly_hours,fields(name)").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(pathError)return reply({error:"Could not load your roadmap. Please retry."},503);
 if(!path)return reply({error:"Roadmap not found"},404);
 const {data:stages,error:stageError}=await client.from("stages").select("id,title,description,estimated_hours").eq("path_id",id).order("order_index");
 if(stageError || !stages?.length)return reply({error:"Could not load your learning stages."},503);
 const field=Array.isArray(path.fields)?path.fields[0]:path.fields;
 let events;try{events=googleEvents(id,field?.name ?? "Learning path",stages.map(s=>({...s,description:s.description ?? ""})),path.weekly_hours,input.date,input.time,input.days,input.timeZone);}catch(error){return reply({error:error instanceof Error?error.message:"Invalid schedule"},400);}
 if(offset>events.length)return reply({error:"Invalid schedule position"},400);
 let added=0,existing=0;const stop=Math.min(offset+2,events.length);
 for(let i=offset;i<stop;i++){
  try{const outcome=await insertGoogleEvent(token.accessToken,events[i]);if(outcome==="added")added++;else existing++;}
  catch(error){return reply({error:error instanceof Error?error.message:"Calendar import interrupted",nextOffset:i,total:events.length,added,existing},502);}
 }
 return reply({added,existing,total:events.length,nextOffset:stop,complete:stop===events.length});
}
