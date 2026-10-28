'use client';
import {useActionState,useState} from 'react';
import {saveLearningAccess} from '@/app/settings/library/actions';
import type {LearningAccess} from '@/lib/learning-access';
import styles from '@/app/settings/library/library.module.css';
const initial={ok:false,message:''};
export function LibraryAccessForm({courseId,entry,subscription=false}:{courseId?:string;entry?:LearningAccess;subscription?:boolean}){
 const [state,action,pending]=useActionState(saveLearningAccess,initial);
 const [date,setDate]=useState(entry?.expires_on??'');const [active,setActive]=useState(entry?.active??true);
 const isSubscription=subscription||entry?.access_type==='subscription';
 const formId=entry?.id??courseId??'scrimba-pro';
 return <form action={action} className={styles.form}>
  <input type="hidden" name="accessKind" value={isSubscription?'subscription':'course'}/>
  {!isSubscription&&<input type="hidden" name="resourceId" value={entry?.resource_id??courseId??''}/>}
  {entry&&<><input type="hidden" name="entryId" value={entry.id}/><input type="hidden" name="version" value={entry.updated_at}/></>}
  <label htmlFor={'access-date-'+formId}>{isSubscription?'Paid through':'Access ends (optional)'}</label>
  <input id={'access-date-'+formId} name="expiresOn" type="date" min="2000-01-01" max="2099-12-31" required={isSubscription} value={date} onChange={event=>setDate(event.target.value)} disabled={pending} aria-describedby={'access-hint-'+formId}/>
  <p id={'access-hint-'+formId} className={styles.hint}>{isSubscription?'Use the date your current payment covers. Future automatic renewals are not assumed.':'Leave blank only if your course access has no expiry.'} Dates include the full day in UTC.</p>
  {entry?<label className={styles.toggle}><input type="checkbox" name="active" checked={active} onChange={event=>setActive(event.target.checked)} disabled={pending}/> Use this access in my roadmaps</label>:<label className={styles.toggle}><input type="checkbox" name="confirmAccess" required disabled={pending}/> I confirm I already have this access. This does not purchase or verify it.</label>}
  {state.message&&<p role={state.ok?'status':'alert'} className={styles.feedback}>{state.message}</p>}
  <button type="submit" disabled={pending} aria-busy={pending}>{pending?'Saving…':entry?'Save access changes':'Add to my library'}</button>
 </form>;
}