import {createHash,randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getLearningUser} from "@/lib/auth/learning-user";
import {getRequestOrigin} from "@/lib/site";
import {requireUuid} from "@/lib/security/validation";
import {calendarConfigured,sameOrigin,STATE_COOKIE,sealCalendar,cookieOptions,CALENDAR_SCOPE} from "@/lib/calendar/google-session";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
 const origin=getRequestOrigin(request);
 if(!sameOrigin(request,origin))return Response.json({error:"Invalid request origin"},{status:403});
 const {id}=await params;try{requireUuid(id);}catch{return Response.json({error:"Invalid path"},{status:400});}
 const client=await createClient();const {data:{user}}=await getLearningUser(client);
 if(!user)return NextResponse.redirect(new URL("/login?next="+encodeURIComponent(`/paths/${id}`),origin),303);
 const {data:path,error}=await client.from("learning_paths").select("id").eq("id",id).eq("user_id",user.id).maybeSingle();
 if(error)return Response.json({error:"Could not load roadmap"},{status:503});
 if(!path)return Response.json({error:"Roadmap not found"},{status:404});
 if(!calendarConfigured())return NextResponse.redirect(new URL(`/paths/${id}?calendar_error=configuration`,origin),303);
 const state=randomBytes(32).toString("base64url"),verifier=randomBytes(32).toString("base64url");
 const redirectUri=origin+"/auth/google-calendar/callback";
 (await cookies()).set(STATE_COOKIE,sealCalendar({userId:user.id,pathId:id,state,verifier,redirectUri,expires:Date.now()+600000}),{...cookieOptions,maxAge:600});
 const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
 url.search=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,redirect_uri:redirectUri,response_type:"code",scope:CALENDAR_SCOPE,state,code_challenge:createHash("sha256").update(verifier).digest("base64url"),code_challenge_method:"S256",access_type:"online",prompt:"consent select_account"}).toString();
 const response=NextResponse.redirect(url,303);response.headers.set("Cache-Control","private, no-store");response.headers.set("Referrer-Policy","no-referrer");return response;
}
