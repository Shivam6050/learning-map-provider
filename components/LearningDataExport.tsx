"use client";
import {useRef,useState} from 'react';
import styles from './LearningDataExport.module.css';
export function LearningDataExport({pathId}:{pathId?:string}){
 const lock=useRef(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[auth,setAuth]=useState<number|null>(null);
 async function download(format:'json'|'markdown'){
  if(lock.current)return;lock.current=true;setBusy(true);setMessage('');setAuth(null);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
  try{
   const query=new URLSearchParams({format});if(pathId)query.set('path',pathId);
   const response=await fetch('/settings/export?'+query,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
   if(!response.ok){setAuth(response.status);const data=await response.json().catch(()=>null);throw new Error(data?.error??'Could not prepare your download. Please retry.');}
   if(!response.headers.get('content-disposition')?.startsWith('attachment;'))throw new Error('Please sign in again before exporting.');
   const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download=response.headers.get('content-disposition')?.match(/filename="([a-z0-9.-]+)"/)?.[1]??'learningmap-export.'+(format==='json'?'json':'md');
   document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
   setMessage('Your download is ready. Check your browser’s downloads.');
  }catch(error){setMessage(error instanceof Error&&error.name!=='AbortError'?error.message:'The download took too long. Please retry or export one roadmap.');}
  finally{clearTimeout(timer);lock.current=false;setBusy(false);}
 }
 const content=<section className={styles.panel} aria-label={pathId?'Export this roadmap':'Export your learning data'}>
  <p className={styles.eyebrow}>YOUR WORK, TO KEEP</p><h2>{pathId?'Take this roadmap with you.':'Keep a copy of your learning.'}</h2>
  <p>Download {pathId?'this roadmap':'your saved roadmaps'}, resources, notes, topic checks and project milestones. Choose a readable Markdown document or a structured JSON file.</p>
  <div className={styles.actions}><button type="button" disabled={busy} onClick={()=>download('markdown')}>Download Markdown <span aria-hidden="true">↓</span></button><button type="button" disabled={busy} onClick={()=>download('json')}>Download JSON <span aria-hidden="true">↓</span></button></div>
  <p className={styles.note}>A copy of saved work, not a certificate or an account backup. Keep the downloaded file private. No course purchases, passwords or sign-in keys are included.</p>
  <div role="status" aria-live="polite" aria-atomic="true">{busy?'Preparing your private download…':message}</div>
  {auth===401&&<a href="/login?next=%2Fsettings">Sign in to continue →</a>}{auth===403&&<a href="/auth/mfa?next=%2Fsettings">Verify your sign-in →</a>}
 </section>;
 return pathId?<details className={styles.disclosure}><summary>Download roadmap & notes <span aria-hidden="true">↓</span></summary>{content}</details>:content;
}
