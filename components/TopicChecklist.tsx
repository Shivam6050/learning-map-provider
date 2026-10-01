"use client";
import {useState} from "react";
import {stageTopics} from "@/lib/paths/topics";
import {saveTopicCompletion} from "@/app/paths/[id]/topics";
import styles from "./Roadmap.module.css";
export function TopicChecklist({pathId,stageId,title,description,initial}:{pathId:string;stageId:string;title:string;description:string|null;initial:Record<string,boolean>}) {
 const topics=stageTopics(title,description);
 const [saved,setSaved]=useState(initial);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const count=topics.filter(topic=>saved[topic.id]===true).length;
 async function toggle(id:string){if(busy)return;setBusy(true);setError("");try{const next=saved[id]!==true;const result=await saveTopicCompletion(pathId,stageId,id,next);if(result.ok)setSaved(current=>({...current,[id]:next}));else setError(result.error??"Please retry.");}catch{setError("Could not save this topic. Please retry.");}finally{setBusy(false);}}
 return <section className={styles.topics} aria-labelledby={"topics-"+stageId}><div className={styles.topicHeader}><h3 id={"topics-"+stageId}>What you’ll learn</h3><span aria-live="polite">{count} / {topics.length} understood</span></div><p className={styles.topicHint}>Use these checks to assess your understanding. They do not certify mastery or automatically complete this stage.</p><ul>{topics.map(topic=><li key={topic.id}><label><input type="checkbox" name={"topic-"+topic.id} checked={saved[topic.id]===true} disabled={busy} onChange={()=>toggle(topic.id)}/><span><strong>{topic.title}</strong><span>{topic.criterion}</span></span></label></li>)}</ul>{error&&<p role="alert">{error}</p>}</section>;
}
