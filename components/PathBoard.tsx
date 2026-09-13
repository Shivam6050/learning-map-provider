"use client";
import styles from "./Roadmap.module.css";
type BoardStage = {id:string;order_index:number;title:string;status:"not_started"|"in_progress"|"completed"};
export function PathBoard({stages}: {stages:BoardStage[];avatarId?:string}) {
 const sorted=[...stages].sort((a,b)=>a.order_index-b.order_index);
 const current=sorted.find(s=>s.status==="in_progress")??sorted.find(s=>s.status!=="completed");
 return <nav aria-label="Roadmap stages"><ol className={styles.navList}>{sorted.map((stage,i)=><li key={stage.id} className={styles.navItem}><a className={styles.navLink} href={"#stage-"+stage.id} aria-current={current?.id===stage.id?"step":undefined} data-complete={stage.status==="completed"} onClick={event=>{event.preventDefault();window.dispatchEvent(new CustomEvent("roadmap-navigate",{detail:stage.id}));}}><span className={styles.node}>{stage.status==="completed"?"✓":String(i+1).padStart(2,"0")}</span><span className={styles.navLabel}>{stage.title}<small>{stage.status==="completed"?"Completed":stage.status==="in_progress"?"In progress":current?.id===stage.id?"Up next":"Not started"}</small></span></a></li>)}</ol></nav>;
}
