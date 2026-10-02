"use client";
import {stageTopics} from "@/lib/paths/topics";
import {useRef,useState} from "react";
import {curriculumUnit} from "@/lib/paths/authored-curriculum";
import {projectMilestones} from "@/lib/paths/milestones";
import {saveMilestoneCompletion} from "@/app/paths/[id]/topics";
import styles from "./Roadmap.module.css";
export function ProjectMilestones({pathId,stageId,title,description,initial}:{pathId:string;stageId:string;title:string;description:string|null;initial:Record<string,boolean>}) {
 const unit=curriculumUnit(title);
 const milestones=projectMilestones(title,description);
 const [saved,setSaved]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState("");const lock=useRef(false);
 const count=milestones.filter(m=>saved[m.id]===true).length;
 async function toggle(id:string) {
  if(lock.current)return;lock.current=true;setBusy(true);setError("");
  try{const next=saved[id]!==true,result=await saveMilestoneCompletion(pathId,stageId,id,next);if(result.ok)setSaved(previous=>({...previous,[id]:next}));else setError(result.error??"Could not save your milestone. Please retry.");}
  catch{setError("Could not save your milestone. Please retry.");}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className={styles.topics} aria-labelledby={"milestones-"+stageId} aria-busy={busy}>
 <div className={styles.topicHeader}><h3 id={"milestones-"+stageId}>Project milestones</h3><span aria-live="polite">{count} / {milestones.length} recorded</span></div>
 <p className={styles.topicHint}>Use your stage challenge as the brief. Record each deliverable when ready; these are self-reported checks, not automatic assessment.</p>
 {unit&&<div className={styles.projectBrief}><span>{unit.level==="advanced"?"Advanced":unit.level==="intermediate"?"Intermediate":"Beginner"} project · {unit.field.replaceAll("-"," ")}</span><h4>Your project brief</h4><p>{unit.project}</p><h4>Acceptance criteria</h4><ul>{stageTopics(title,description).map(topic=><li key={topic.id}>{topic.criterion}</li>)}<li>Provide reproducible steps, evidence of a failure case, and notes explaining limitations.</li></ul></div>}
 <ul>{milestones.map((m,index)=><li key={m.id}><label><input type="checkbox" name={"milestone-"+stageId+"-"+m.id} checked={saved[m.id]===true} disabled={busy} onChange={()=>toggle(m.id)}/><span><strong>{String(index+1).padStart(2,"0")} / {m.title}</strong><span>{m.criterion}</span></span></label></li>)}</ul>
 {busy&&<p className={styles.topicHint} role="status">Saving milestone...</p>}{error&&<p role="alert">{error}</p>}
 </section>;
}
