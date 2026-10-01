import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getRequestOrigin} from "@/lib/site";
import {STATE_COOKIE,TOKEN_COOKIE,openCalendar,sealCalendar,cookieOptions,CALENDAR_SCOPE,type CalendarState} from "@/lib/calendar/google-session";
export async function GET(request:Request) {
 const origin=getRequestOrigin(request),jar=await cookies(),query=new URL(request.url).searchParams;
 const state=openCalendar<CalendarState>(jar.get(STATE_COOKIE)?.value);jar.delete(STATE_COOKIE);
 const result=(path:string)=>{const r=NextResponse.redirect(new URL(path,origin));r.headers.set("Cache-Control","private, no-store");r.headers.set("Referrer-Policy","no-referrer");return r;};
 if(!state || query.get("state")!==state.state)return result("/dashboard?calendar_error=invalid_state");
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user || user.id!==state.userId)return result("/login?next="+encodeURIComponent(`/paths/${state.pathId}`));
 if(query.has("error") || !query.get("code"))return result(`/paths/${state.pathId}?calendar_error=consent`);
 try {
 const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",body:new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID!,client_secret:process.env.GOOGLE_CLIENT_SECRET!,code:query.get("code")!,grant_type:"authorization_code",redirect_uri:state.redirectUri,code_verifier:state.verifier}),signal:AbortSignal.timeout(10000),cache:"no-store"});
 if(!response.ok)throw new Error("Exchange failed");
 const token=await response.json();
 if(typeof token.access_token!=="string" || !Number.isFinite(token.expires_in) || token.expires_in<=60 || !String(token.scope).split(" ").includes(CALENDAR_SCOPE))throw new Error("Missing consent");
 const lifetime=Math.min(token.expires_in-30,3600);
 jar.set(TOKEN_COOKIE,sealCalendar({userId:user.id,accessToken:token.access_token,expires:Date.now()+lifetime*1000}),{...cookieOptions,maxAge:lifetime});
 return result(`/paths/${state.pathId}?calendar_connected=1`);
 }catch{return result(`/paths/${state.pathId}?calendar_error=connection`);}
}
