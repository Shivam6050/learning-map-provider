"use client";

import { useRef, useState } from "react";
import styles from "./AddToCalendar.module.css";

const providers = [
 { id: "google", name: "Google Calendar", mark: "G", steps: "Download your roadmap, then open Google Calendar on a computer. Go to Settings → Import & export, select the downloaded file and choose your calendar.", url: "https://calendar.google.com/", action: "Open Google Calendar" },
 { id: "outlook", name: "Outlook", mark: "O", steps: "Download your roadmap. In Outlook Calendar, choose Add calendar → Upload from file, select the downloaded file and choose your calendar.", url: "https://outlook.live.com/calendar/", action: "Open Outlook" },
 { id: "apple", name: "Apple Calendar / iCal", mark: "A", steps: "Download and open the .ics file with Apple Calendar. On a Mac, you can also use File → Import, then select the calendar to add your stages to." },
 { id: "other", name: "Other calendar apps", mark: "+", steps: "Download the .ics file and open it with a calendar app on your device, or use its Import option. Your app must support iCalendar (.ics) files." },
];
export function AddToCalendar({ pathId }: { pathId: string }) {
 const dialog = useRef<HTMLDialogElement>(null);
 const [selected, setSelected] = useState("google");
 const provider = providers.find(item => item.id === selected)!;
 return <>
  <button type="button" className={styles.trigger} onClick={() => dialog.current?.showModal()}>
   <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h3M8 18h6"/></svg>
   Add to calendar <span aria-hidden="true">↗</span>
  </button>
  <dialog ref={dialog} className={styles.dialog} aria-labelledby="calendar-title" onClick={event => { if(event.target === event.currentTarget) dialog.current?.close(); }}>
   <div className={styles.header}><div><p className={styles.eyebrow}>MAKE TIME TO LEARN</p><h2 id="calendar-title">Your roadmap, on your calendar.</h2></div><button className={styles.close} type="button" aria-label="Close calendar options" onClick={() => dialog.current?.close()}>×</button></div>
   <p className={styles.intro}>Export every stage as an all-day learning window, following your roadmap’s original start date and weekly pace.</p>
   <div className={styles.providers} aria-label="Choose a calendar">
    {providers.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}><span aria-hidden="true" className={styles.mark}>{item.mark}</span>{item.name}<span aria-hidden="true" className={styles.check}>{selected === item.id ? "✓" : ""}</span></button>)}
   </div>
   <section className={styles.instructions} aria-live="polite"><h3>Add to {provider.name}</h3><p>{provider.steps}</p><div className={styles.actions}><a className={styles.download} href={`/paths/${pathId}/ics`} download>Download roadmap (.ics) ↓</a>{provider.url && <a href={provider.url} target="_blank" rel="noopener noreferrer">{provider.action} ↗</a>}</div></section>
   <p className={styles.note}>This is a one-time import, not a live sync. Review your calendar before importing again to avoid duplicates. Calendar availability depends on your device.</p>
  </dialog>
 </>;
}
