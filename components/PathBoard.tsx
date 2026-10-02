"use client";
import {resumeStage} from "@/lib/paths/resume";
import styles from "./Roadmap.module.css";
type BoardStage = {id:string;order_index:number;title:string;updatedAt?:string|null;status:"not_started"|"in_progress"|"completed"};
export function PathBoard({stages,overview=false}: {stages:BoardStage[];avatarId?:string;overview?:boolean}) {
 const sorted=[...stages].sort((a,b)=>a.order_index-b.order_index);
 const current=resumeStage(sorted);
 const complete=sorted.filter(stage=>stage.status==="completed").length;
 if(overview)return <details className={styles.overview}><summary>Roadmap overview <span>{complete} / {sorted.length} stages completed</span></summary><p>A suggested sequence, not a set of locked dependencies. Select any stage to open its resources and practice work.</p><nav aria-label="Roadmap overview"><ol className={styles.overviewMap}>{sorted.map((stage,index)=><li key={stage.id}><a href={"#stage-"+stage.id} aria-current={current?.id===stage.id?"step":undefined} data-complete={stage.status==="completed"} onClick={()=>window.dispatchEvent(new CustomEvent("roadmap-navigate",{detail:stage.id}))}><span>{String(index+1).padStart(2,"0")}</span><strong>{stage.title}</strong><small>{stage.status==="completed"?"Completed":stage.status==="in_progress"?"In progress":current?.id===stage.id?"Up next":"Not started"}</small></a></li>)}</ol></nav></details>;
 return <nav aria-label="Roadmap stages"><ol className={styles.navList}>{sorted.map((stage,i)=><li key={stage.id} className={styles.navItem}><a className={styles.navLink} href={"#stage-"+stage.id} aria-current={current?.id===stage.id?"step":undefined} data-complete={stage.status==="completed"} onClick={()=>{window.dispatchEvent(new CustomEvent("roadmap-navigate",{detail:stage.id}));}}><span className={styles.node}>{stage.status==="completed"?"✓":String(i+1).padStart(2,"0")}</span><span className={styles.navLabel}>{stage.title}<small>{stage.status==="completed"?"Completed":stage.status==="in_progress"?"In progress":current?.id===stage.id?"Up next":"Not started"}</small></span></a></li>)}</ol></nav>;
}
