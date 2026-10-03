"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./AddToCalendar.module.css";
export function GoogleCalendarImport({pathId,date,time,days,disabled,onBusyChange}:{pathId:string;date:string;time:string;days:number[];disabled:boolean;onBusyChange:(busy:boolean)=>void}) {
 const [connection,setConnection]=useState({configured:false,connected:false});
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState("");
 const lock=useRef(false);
 const resume=useRef({schedule:"",offset:0});
 const endpoint=`/paths/${pathId}/google-calendar`;
 useEffect(()=>{let active=true;fetch(endpoint,{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{if(active)setConnection(data);}).catch(()=>{if(active)setMessage("Could not check Google Calendar. The file download remains available.");});return()=>{active=false;};},[endpoint]);
 async function disconnect() {
  if(lock.current)return;
  lock.current=true;setPending(true);onBusyChange(true);setMessage("");
  try {
   const response=await fetch(endpoint,{method:"DELETE",signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw new Error("Could not disconnect Google Calendar. Please retry.");
   setConnection(value=>({...value,connected:false}));
   resume.current={schedule:"",offset:0};
   try{sessionStorage.removeItem(`calendar-${pathId}`);}catch{}
   setMessage("Google Calendar disconnected from this browser. Imported events remain in your calendar.");
  }catch{setMessage("Could not disconnect Google Calendar. Please retry.");}
  finally{lock.current=false;setPending(false);onBusyChange(false);}
 }
 async function add() {
  if(disabled || lock.current)return;
  lock.current=true;setPending(true);onBusyChange(true);setMessage("Adding study sessions...");
  const schedule={date,time,days,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone};
  const signature=JSON.stringify(schedule);
  let offset=resume.current.schedule===signature?resume.current.offset:0;
  resume.current={schedule:signature,offset};
  try {while(true){
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...schedule,offset}),signal:AbortSignal.timeout(55000)});
   const result=await response.json();
   if(!response.ok){
    if(Number.isInteger(result.nextOffset) && result.nextOffset>=offset)resume.current={schedule:signature,offset:result.nextOffset};
    if(result.reconnect || response.status===401)setConnection(value=>({...value,connected:false}));
    throw new Error(result.error ?? "Calendar import interrupted.");
   }
   if(!Number.isInteger(result.nextOffset)||result.nextOffset<offset||(!result.complete && result.nextOffset===offset))throw new Error("Invalid calendar response.");
   offset=result.nextOffset;resume.current={schedule:signature,offset};setMessage(`${offset} of ${result.total} sessions processed.`);
   if(result.complete){resume.current={schedule:signature,offset:0};setMessage(`Your ${result.total} study sessions are in Google Calendar. Existing sessions were preserved.`);break;}
  }}catch(error){setMessage((error instanceof Error && error.name==="Error"?error.message:"Connection interrupted.")+" Retry the same schedule to continue without duplicates.");}
  finally{lock.current=false;setPending(false);onBusyChange(false);}
 }
 if(!connection.configured)return message?<p role="status">{message}</p>:null;
 return <div><p>Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p><p>Add timed sessions directly to your primary Google calendar. This is a one-time schedule, without ongoing sync.</p><div className={styles.actions}>{connection.connected?<button type="button" className={styles.download} disabled={disabled||pending} aria-busy={pending} onClick={add}>{pending?"Adding sessions...":"Add sessions to Google Calendar"}</button>:<form method="post" action={endpoint+"/connect"} onSubmit={()=>{try{sessionStorage.setItem(`calendar-${pathId}`,JSON.stringify({date,time,days}));}catch{}}}><button type="submit" className={styles.download} disabled={disabled}>Connect Google Calendar</button></form>}{connection.connected && <form method="post" action={endpoint+"/connect"} onSubmit={()=>{try{sessionStorage.setItem(`calendar-${pathId}`,JSON.stringify({date,time,days}));}catch{}}}><button type="submit" className={styles.download} disabled={pending||disabled}>Reconnect or change Google account</button></form>}{connection.connected && <button type="button" className={styles.download} disabled={pending} onClick={disconnect}>Disconnect Google Calendar</button>}</div><p>Disconnecting clears this browser’s temporary connection. To revoke the app’s permission in Google, visit <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">Google Account connections ↗</a>. Imported events are kept.</p>{message && <p role="status">{message}</p>}</div>;
}
