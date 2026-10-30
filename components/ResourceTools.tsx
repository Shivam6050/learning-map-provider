"use client";
import { useActionState,useState,useTransition } from "react";
import { loadResourceReplacements,replaceRoadmapResource,submitResourceReport,loadResourceReports } from "@/app/paths/[id]/resources";
import { REPORT_REASONS,type ReportReason,type ResourceReportsState,type ReplacementOptionsState } from "@/lib/paths/resource-management";
import styles from "./ResourceTools.module.css";
import { ReplacementChoices } from "./ReplacementChoices";
const initial={ok:false,message:""};
export function ResourceTools({pathId,stageId,resourceId,title,isCourse=false,isUnavailable=false,priceUnverified=false}: {pathId:string;stageId:string;resourceId:string;title:string;isCourse?:boolean;isUnavailable?:boolean;priceUnverified?:boolean}) {
 const [tab,setTab]=useState<"replace"|"report">("replace");
 const [loaded,setLoaded]=useState<ReplacementOptionsState>({...initial,options:[]});
 const [loading,startLoading]=useTransition();
 const [reports,setReports]=useState<ResourceReportsState>({...initial,reports:[]});
 const [selection,setSelection]=useState("");
 const [owned,setOwned]=useState(false);
 const [reason,setReason]=useState<ReportReason>("broken_link");
 const [details,setDetails]=useState("");
 const [replaceState,replaceAction,replacing]=useActionState(replaceRoadmapResource,initial);
 const [reportState,reportAction,reporting]=useActionState(submitResourceReport,initial);
 const selected=loaded.options.find(option=>option.id===selection);
 const busy=loading||replacing||reporting;
 const identifiers=<><input type="hidden" name="pathId" value={pathId}/><input type="hidden" name="stageId" value={stageId}/><input type="hidden" name="resourceId" value={resourceId}/></>;
 function findAlternatives(){
  const form=new FormData();form.set("pathId",pathId);form.set("stageId",stageId);form.set("resourceId",resourceId);
  startLoading(async()=>{try{const result=await loadResourceReplacements(form);setLoaded(result);setSelection("");setOwned(false);}catch{setLoaded({ok:false,message:"Could not load alternatives. Please try again.",options:[]});}});
 }
 function checkReports(){
  const form=new FormData();form.set("pathId",pathId);form.set("stageId",stageId);form.set("resourceId",resourceId);
  startLoading(async()=>{try{setReports(await loadResourceReports(form));}catch{setReports({ok:false,message:"Your reports could not be loaded. Please retry.",reports:[]});}});
 }
 return <details className={styles.tools}>
  <summary>{isUnavailable ? "Find a replacement or report unavailable resource" : priceUnverified ? "Confirm price, find a replacement or report a problem" : "Change resource or report a problem"} <span aria-hidden="true">⌄</span></summary>
  <div className={styles.body}>
   {isCourse&&<a className={styles.secondary} href={"/settings/library?course="+encodeURIComponent(resourceId)}>Already have this course? Manage library access ↗</a>}
   <div className={styles.tabs} aria-label="Resource actions">
    <button type="button" aria-pressed={tab==="replace"} disabled={busy} onClick={()=>setTab("replace")}>Find a replacement</button>
    <button type="button" aria-pressed={tab==="report"} disabled={busy} onClick={()=>setTab("report")}>Report a problem</button>
   </div>
   {tab==="replace"?<section aria-label={"Replace "+title}>
    <p className={styles.hint}>Choose another way to learn this stage. Your notes, project milestones and completion progress stay in place. Opening a provider link does not buy a course.</p>
    <button className={styles.secondary} type="button" onClick={findAlternatives} disabled={busy} aria-busy={loading}>{loading?"Checking alternatives…":loaded.message?"Refresh alternatives":"Find matching resources"}</button>
    {loading&&<p role="status" className={styles.hint}>Checking trusted resources, availability and regional prices. No AI generation is needed.</p>}
    {loaded.message&&!loading&&<p role={loaded.ok?"status":"alert"} className={styles.hint}>{loaded.message}</p>}
    {loaded.options.length>0&&<form action={replaceAction}>
     {identifiers}
     <ReplacementChoices loaded={loaded} selection={selection} owned={owned} busy={busy} onSelect={(id,alreadyOwned)=>{setSelection(id);setOwned(alreadyOwned);}} onOwnedChange={setOwned}/>
     {replaceState.message&&<p role={replaceState.ok?"status":"alert"} className={styles.feedback}>{replaceState.message}</p>}
     <button type="submit" className={styles.primary} disabled={busy||!selected||Boolean(selected?.requiresOwnership&&!owned)} aria-busy={replacing}>{replacing?"Saving replacement…":"Replace resource"}</button>
    </form>}
   </section>:<section aria-label={"Report a problem with "+title}>
    <p className={styles.hint}>Tell us what went wrong with this resource. An administrator can review your report. Reports do not automatically change prices, remove courses or reset progress.</p>
    <form action={reportAction} className={styles.report}>
     {identifiers}
     <label>What needs attention?<select name="reason" required disabled={busy} value={reason} onChange={event=>setReason(event.target.value as ReportReason)}>{Object.entries(REPORT_REASONS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
     <label>Details (optional)<textarea name="details" value={details} onChange={event=>setDetails(event.target.value)} rows={4} maxLength={1000} disabled={busy} placeholder="For a price issue, include the amount, currency and billing period you saw."/></label>
     <small>Up to 1,000 characters. Include only information needed to review this resource.</small>
     {reportState.message&&<p role={reportState.ok?"status":"alert"} className={styles.feedback}>{reportState.message}</p>}
     <button type="submit" className={styles.primary} disabled={busy} aria-busy={reporting}>{reporting?"Submitting report…":"Submit resource report"}</button>
    </form>
    <div className={styles.myReports}>
     <button type="button" className={styles.secondary} disabled={busy} onClick={checkReports}>{loading?"Loading your reports…":"Check my report status"}</button>
     {reports.message&&<p role={reports.ok?"status":"alert"} className={styles.hint}>{reports.message}</p>}
     {reports.reports.length>0&&<ul>{reports.reports.map(report=><li key={report.id}><strong>{REPORT_REASONS[report.reason]}</strong><span>{report.status} · {report.created_at.slice(0,10)}</span>{report.resolution&&<p>{report.resolution}</p>}</li>)}</ul>}
    </div>
   </section>}
  </div>
 </details>;
}
