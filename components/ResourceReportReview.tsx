"use client";
import { useActionState,useState } from "react";
import { reviewResourceReport } from "@/app/admin/resource-reports/actions";
import styles from "./ResourceTools.module.css";
export function ResourceReportReview({id,status,resolution,reviewedAt}: {id:string;status:string;resolution:string;reviewedAt:string|null}) {
 const [note,setNote]=useState(resolution);
 const [choice,setChoice]=useState(status==="open"?"reviewing":status);
 const [state,action,pending]=useActionState(reviewResourceReport,{ok:false,message:""});
 return <form action={action} className={styles.report}>
  <input type="hidden" name="reportId" value={id}/><input type="hidden" name="expectedStatus" value={status}/><input type="hidden" name="expectedReviewedAt" value={reviewedAt??""}/>
  <label>Review status<select name="status" value={choice} onChange={event=>setChoice(event.target.value)} disabled={pending}><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label>
  <label>Review note<textarea name="resolution" value={note} onChange={event=>setNote(event.target.value)} maxLength={500} rows={2} disabled={pending}/></label>
  <small>Keep the note focused on the resource. Learners can access their own reports and review notes.</small>
  {state.message&&<p role={state.ok?"status":"alert"} className={styles.feedback}>{state.message}</p>}
  <button className={styles.primary} type="submit" disabled={pending}>{pending?"Saving review…":"Save review"}</button>
 </form>;
}
