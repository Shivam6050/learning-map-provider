"use client";

import { useRef, useState } from "react";
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
 const [days,setDays]=useState([1,2,3,4,5]);
 const provider = providers.find(item => item.id === selected)!;
 return <>
  <button type="button" className={styles.trigger} onClick={() => { if(!date) { const d=new Date();d.setDate(d.getDate()+1);setDate(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")); } dialog.current?.showModal(); }}>
   <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h3M8 18h6"/></svg>
   Add to calendar <span aria-hidden="true">↗</span>
  </button>
  <dialog ref={dialog} className={styles.dialog} aria-labelledby="calendar-title" onClick={event => { if(event.target === event.currentTarget) dialog.current?.close(); }}>
   <div className={styles.header}><div><p className={styles.eyebrow}>MAKE TIME TO LEARN</p><h2 id="calendar-title">Your roadmap, on your calendar.</h2></div><button className={styles.close} type="button" aria-label="Close calendar options" onClick={() => dialog.current?.close()}>×</button></div>
   <p className={styles.intro}>Schedule timed study sessions using your roadmap’s weekly hours. Time is shared across your selected days, in your calendar’s local time zone.</p>
   <div className={styles.schedule}><label>Start date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Daily start time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><fieldset><legend>Study days</legend>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((name,i)=><label key={name}><input type="checkbox" checked={days.includes(i)} onChange={()=>setDays(days.includes(i)?days.filter(d=>d!==i):[...days,i])}/>{name}</label>)}</fieldset></div>
   <div className={styles.providers} aria-label="Choose a calendar">
    {providers.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}><span aria-hidden="true" className={styles.mark}>{item.mark}</span>{item.name}<span aria-hidden="true" className={styles.check}>{selected === item.id ? "✓" : ""}</span></button>)}
   </div>
   <section className={styles.instructions} aria-live="polite"><h3>Add to {provider.name}</h3><p>{provider.steps}</p><div className={styles.actions}><a className={styles.download} href={`/paths/${pathId}/ics?${new URLSearchParams({date,time,days:days.join(",")})}`} download>Download timed schedule (.ics) ↓</a>{provider.url && <a href={provider.url} target="_blank" rel="noopener noreferrer">{provider.action} ↗</a>}</div></section>
   <p className={styles.note}>Google requires importing the downloaded file; opening its calendar does not save events automatically. This is a one-time import, not a live sync. Review your calendar before importing again to avoid duplicates. Calendar availability depends on your device.</p>
  </dialog>
 </>;
}
