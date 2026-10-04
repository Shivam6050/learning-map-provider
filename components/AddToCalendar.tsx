"use client";

import { useEffect, useRef, useState } from "react";
import { fetchCalendar } from "@/lib/export/download-calendar";
import { GoogleCalendarImport } from "./GoogleCalendarImport";
import styles from "./AddToCalendar.module.css";

const providers = [
 { id: "google", name: "Google Calendar", mark: "G", steps: "Download your roadmap, then open Google Calendar on a computer. Go to Settings → Import & export, select the downloaded file and choose your calendar.", url: "https://calendar.google.com/calendar/u/0/r/settings/export", action: "Import downloaded schedule" },
 { id: "outlook", name: "Outlook", mark: "O", steps: "Download your roadmap. In Outlook Calendar, choose Add calendar → Upload from file, select the downloaded file and choose your calendar.", url: "https://outlook.live.com/calendar/", action: "Open Outlook" },
 { id: "apple", name: "Apple Calendar / iCal", mark: "A", steps: "Download and open the .ics file with Apple Calendar. On a Mac, you can also use File → Import, then select the calendar to add your stages to." },
 { id: "other", name: "Other calendar apps", mark: "+", steps: "Download the .ics file and open it with a calendar app on your device, or use its Import option. Your app must support iCalendar (.ics) files." },
];
export function AddToCalendar({ pathId }: { pathId: string }) {
 const dialog = useRef<HTMLDialogElement>(null);
 const [selected, setSelected] = useState("google");
 const [date,setDate]=useState("");
 const [time,setTime]=useState("09:00");
 const [importing,setImporting]=useState(false);
 const [days,setDays]=useState([1,2,3,4,5]);
 const scheduleError = !date || !time ? "Choose a start date and time." : !days.length ? "Choose at least one study day." : "";
 const [downloading,setDownloading]=useState(false);
 const [downloadError,setDownloadError]=useState("");
 const busy = importing || downloading;
 useEffect(()=>{
  const query=new URLSearchParams(window.location.search);
  if(!query.has("calendar_connected") && !query.has("calendar_error"))return;
  const frame=requestAnimationFrame(()=>{
  try{const saved=JSON.parse(sessionStorage.getItem(`calendar-${pathId}`) ?? "null");if(saved && typeof saved.date==="string" && typeof saved.time==="string" && Array.isArray(saved.days)){setDate(saved.date);setTime(saved.time);setDays(saved.days);}}catch{}
  if(query.has("calendar_error"))setDownloadError("Google Calendar could not connect. Please try connecting again or download your schedule.");
  dialog.current?.showModal();
  });
  query.delete("calendar_connected");query.delete("calendar_error");
  window.history.replaceState(null,"",window.location.pathname+(query.size?"?"+query:"")+window.location.hash);
  return()=>cancelAnimationFrame(frame);
 },[pathId]);
 const downloadLock=useRef(false);
 async function downloadSchedule() {
  if(scheduleError || importing || downloadLock.current)return;
  downloadLock.current=true;setDownloading(true);setDownloadError("");
  try {
   const blob=await fetchCalendar(`/paths/${pathId}/ics?${new URLSearchParams({date,time,days:days.join(",")})}`);
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");link.href=url;link.download="learning-path.ics";
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
  } catch(error) {
   setDownloadError(error instanceof Error && error.name !== "TimeoutError" && error.name !== "TypeError" ? error.message : "The download couldn’t finish. Check your connection and try again.");
  } finally {downloadLock.current=false;setDownloading(false);}
 }
 const provider = providers.find(item => item.id === selected)!;
 return <>
  <button type="button" className={styles.trigger} onClick={() => { if(!date) { const d=new Date();d.setDate(d.getDate()+1);setDate(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")); } dialog.current?.showModal(); }}>
   <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h3M8 18h6"/></svg>
   Add to calendar <span aria-hidden="true">↗</span>
  </button>
  <dialog ref={dialog} className={styles.dialog} aria-labelledby="calendar-title" onClick={event => { if(event.target === event.currentTarget) dialog.current?.close(); }}>
   <div className={styles.header}><div><p className={styles.eyebrow}>MAKE TIME TO LEARN</p><h2 id="calendar-title">Your roadmap, on your calendar.</h2></div><button className={styles.close} type="button" aria-label="Close calendar options" onClick={() => dialog.current?.close()}>×</button></div>
   <p className={styles.intro}>Schedule timed study sessions using your roadmap’s weekly hours. Time is shared across your selected days, in your calendar’s local time zone.</p>
   <div className={styles.schedule}><label>Start date<input name="calendar-start-date" type="date" disabled={busy} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Daily start time<input name="calendar-start-time" type="time" disabled={busy} value={time} onChange={e=>setTime(e.target.value)}/></label><fieldset><legend>Study days</legend>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((name,i)=><label key={name}><input name="calendar-study-days" value={i} type="checkbox" disabled={busy} checked={days.includes(i)} onChange={()=>setDays(days.includes(i)?days.filter(d=>d!==i):[...days,i])}/>{name}</label>)}</fieldset></div>
   {scheduleError && <p id="calendar-schedule-error" role="status" className={styles.validation}>{scheduleError}</p>}
   <div className={styles.providers} aria-label="Choose a calendar" aria-describedby={busy ? "calendar-operation-status" : undefined}>
    {providers.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} disabled={busy} onClick={() => setSelected(item.id)}><span aria-hidden="true" className={styles.mark}>{item.mark}</span>{item.name}<span aria-hidden="true" className={styles.check}>{selected === item.id ? "✓" : ""}</span></button>)}
   </div>
   {busy && <p id="calendar-operation-status" role="status" className={styles.note}>Calendar and schedule choices are locked until this operation finishes.</p>}
   <section className={styles.instructions} aria-live="polite"><h3>Add to {provider.name}</h3><p>{provider.steps}</p>{selected === "google" && <GoogleCalendarImport pathId={pathId} date={date} time={time} days={days} disabled={Boolean(scheduleError) || busy} onBusyChange={setImporting} />}<div className={styles.actions}><button type="button" className={styles.download} disabled={Boolean(scheduleError) || busy} aria-busy={downloading} aria-describedby={scheduleError ? "calendar-schedule-error" : undefined} onClick={downloadSchedule}>{downloading ? "Preparing schedule…" : "Download timed schedule (.ics) ↓"}</button>{provider.url && <a href={provider.url} target="_blank" rel="noopener noreferrer">{provider.action} ↗</a>}</div></section>
   {downloadError && <p role="alert" className={styles.validation}>{downloadError}</p>}
   <p className={styles.note}>Connecting Google alone does not create events. Use Add sessions after connecting, or import the downloaded file. This is a one-time import, not a live sync. Review your calendar before importing again to avoid duplicates. Calendar availability depends on your device.</p>
  </dialog>
 </>;
}
