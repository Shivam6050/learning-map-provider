import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
export const STATE_COOKIE = "learning-map-calendar-state";
export const TOKEN_COOKIE = "learning-map-calendar-token";
export const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events.owned";
export const cookieOptions = {httpOnly:true,secure:process.env.NODE_ENV === "production",sameSite:"lax" as const,path:"/"};
function key() {
 const value=process.env.GOOGLE_CALENDAR_COOKIE_KEY ?? "";
 if(!/^[a-f0-9]{64}$/i.test(value))throw new Error("Calendar connection is not configured");
 return Buffer.from(value,"hex");
}
export function calendarConfigured() {return Boolean(process.env.GOOGLE_CLIENT_ID?.endsWith(".apps.googleusercontent.com") && process.env.GOOGLE_CLIENT_SECRET && /^[a-f0-9]{64}$/i.test(process.env.GOOGLE_CALENDAR_COOKIE_KEY ?? ""));}
export function sealCalendar(value:Record<string,unknown>) {
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);
 cipher.setAAD(Buffer.from("learningmap-calendar-v1"));
 const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),ciphertext]).toString("base64url");
}
export function openCalendar<T extends {expires:number}>(value:string|undefined):T|null {
 try {if(!value || value.length>3800)return null;const bytes=Buffer.from(value,"base64url");
 const cipher=createDecipheriv("aes-256-gcm",key(),bytes.subarray(0,12));cipher.setAAD(Buffer.from("learningmap-calendar-v1"));cipher.setAuthTag(bytes.subarray(12,28));
 const payload=JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]).toString("utf8"));
 return typeof payload.expires === "number" && payload.expires>Date.now()?payload:null;
 }catch{return null;}
}
export type CalendarToken={userId:string;accessToken:string;expires:number};
export type CalendarState={userId:string;pathId:string;state:string;verifier:string;expires:number;redirectUri:string};
export function sameOrigin(request:Request,origin:string) {return request.headers.get("origin")===origin && request.headers.get("sec-fetch-site")!=="cross-site";}
