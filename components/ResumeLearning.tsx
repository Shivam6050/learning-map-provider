"use client";
import {useSyncExternalStore} from "react";
import type {RoadmapStage} from "@/lib/paths/stage";
import {resourceEvent,resourceStorageKey,parseLastResource} from "@/lib/paths/last-resource";
import {resumeStage} from "@/lib/paths/resume";
import {courseLink} from "@/lib/affiliates/links";
import styles from "./Roadmap.module.css";
function subscribe(notify:()=>void){window.addEventListener("storage",notify);window.addEventListener(resourceEvent,notify);return()=>{window.removeEventListener("storage",notify);window.removeEventListener(resourceEvent,notify);};}
export function ResumeLearning({stages,pathId,viewerId}:{stages:RoadmapStage[];pathId:string;viewerId:string}) {
 const raw=useSyncExternalStore(subscribe,()=>{try{return localStorage.getItem(resourceStorageKey(viewerId,pathId));}catch{return null;}},()=>null);
 const local=parseLastResource(raw);
 const visits=stages.flatMap(stage=>{const visit=stage.stage_progress?.[0]?.practice_check?.resource_visit;return visit&&Number.isFinite(Date.parse(visit.opened_at))?[{stageId:stage.id,resourceId:visit.resource_id,openedAt:visit.opened_at}]:[];}).sort((a,b)=>Date.parse(b.openedAt)-Date.parse(a.openedAt));
 const synced=visits[0];
 const last=local&&(!synced||(Date.parse(local.openedAt??"")||0)>Date.parse(synced.openedAt))?local:synced;
 const isSynced=Boolean(synced&&last===synced);
 const sequence=[...stages].sort((a,b)=>a.order_index-b.order_index);
 const current=resumeStage(sequence.map(stage=>({...stage,status:stage.stage_progress?.[0]?.status??"not_started",updatedAt:stage.stage_progress?.[0]?.updated_at})));
 const previous=sequence.find(stage=>stage.id===last?.stageId&&stage.stage_progress?.[0]?.status!=="completed");
 const resource=previous?.stage_resources.find(item=>item.resources.id===last?.resourceId)?.resources;
 const outgoing=resource&&resource.link_status!=="broken"?courseLink(resource.url,resource.signals?.affiliate===true):null;
 const target=outgoing?.href?previous:current;
 if(!target)return null;
 return <section className={styles.resumePanel} aria-label="Resume learning"><div><span className={styles.eyebrow}>PICK UP WHERE YOU LEFT OFF</span><h2>{target.title}</h2><p>{outgoing?.href?(isSynced?"Last opened resource: ":"Last opened on this browser: ")+resource?.title:"Your next focused learning session."}</p></div><div className={styles.resumeActions}><a href={"#stage-"+target.id} onClick={()=>window.dispatchEvent(new CustomEvent("roadmap-navigate",{detail:target.id}))}>Resume stage</a>{outgoing?.href&&<a href={outgoing.href} target="_blank" rel={outgoing.affiliate?"sponsored noopener noreferrer":"noopener noreferrer"}>Reopen resource <span aria-hidden="true">↗</span></a>}</div><small>{isSynced?"Resource history is saved to your account and available across devices.":"Resource history syncs to your account when the save succeeds."} Completed stages and unavailable links are excluded.</small></section>;
}
