import { createHash } from "node:crypto";
import { studySessions, type StudyStage } from "@/lib/export/study-sessions";
export function googleEvents(pathId:string,fieldName:string,stages:StudyStage[],weeklyHours:number,date:string,time:string,days:number[],timeZone:string) {
 if(typeof timeZone!=="string" || timeZone.length>100)throw new Error("Choose a valid time zone");
 try {new Intl.DateTimeFormat("en",{timeZone}).format();}catch{throw new Error("Choose a valid time zone");}
 const format=(value:string)=>value.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/,"$1-$2-$3T$4:$5:$6");
 return studySessions(stages,weeklyHours,date,time,days).map(session=>({
 id:createHash("sha256").update(JSON.stringify(["learningmap-v1",pathId,session.stage.id,session.start,session.end,timeZone])).digest("hex"),
 summary:fieldName+": "+session.stage.title,
 description:session.stage.description+"\nStudy session: "+session.minutes+" minutes.",
 start:{dateTime:format(session.start),timeZone},end:{dateTime:format(session.end),timeZone},
 extendedProperties:{private:{learningmapPath:pathId,learningmapStage:session.stage.id}},
 }));
}
export async function insertGoogleEvent(accessToken:string,event:ReturnType<typeof googleEvents>[number]) {
 const headers={Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"};
 const url="https://www.googleapis.com/calendar/v3/calendars/primary/events";
 const response=await fetch(url,{method:"POST",headers,body:JSON.stringify(event),signal:AbortSignal.timeout(8000),cache:"no-store"});
 if(response.ok)return "added" as const;
 if(response.status===409){
  const previous=await fetch(url+"/"+event.id,{headers,signal:AbortSignal.timeout(8000),cache:"no-store"});
  if(previous.ok){const existing=await previous.json();if(existing.status!=="cancelled" && existing.extendedProperties?.private?.learningmapPath===event.extendedProperties.private.learningmapPath && existing.extendedProperties?.private?.learningmapStage===event.extendedProperties.private.learningmapStage)return "existing" as const;}
  throw new Error("An existing calendar event could not be verified. Review your calendar before retrying.");
 }
 if(response.status===401)throw new Error("Your Google connection expired. Connect again to continue.");
 if(response.status===403)throw new Error("Google denied calendar access. Check API activation and consent permissions.");
 if(response.status===429)throw new Error("Google is limiting requests. Wait a moment, then retry the same schedule.");
 throw new Error("Google could not add this session. Retry the same schedule to continue safely.");
}
