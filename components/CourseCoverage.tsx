import type {RoadmapStage} from "@/lib/paths/stage";
import {stageTopics} from "@/lib/paths/topics";
import {reviewedCoverage,coverageReviewState} from "@/lib/paths/coverage";
import styles from "./Roadmap.module.css";
export function CourseCoverage({stage}:{stage:RoadmapStage}) {
 const topics=stageTopics(stage.title,stage.description,stage.stage_progress?.[0]?.practice_check?.curriculum_ref);
 const resources=stage.stage_resources.map(item=>Array.isArray(item.resources)?item.resources[0]:item.resources).filter(Boolean);
 if(!resources.length||!topics.length)return null;
 return <details className={styles.coverage}><summary>Course and resource coverage</summary><p>Mapped means the reviewed provider page includes relevant material. It does not guarantee full coverage or mastery. Unverified does not mean absent.</p>
 <div className={styles.coverageScroll} tabIndex={0} role="region" aria-label={"Resource coverage for "+stage.title}>
 <table><caption>Stage concepts mapped to provider material</caption><thead><tr><th scope="col">Resource</th>{topics.map(t=><th scope="col" key={t.id}>{t.title}</th>)}</tr></thead><tbody>{resources.map((resource,index)=>{const review=reviewedCoverage(resource.url,resource.link_status);return <tr key={resource.id+"-"+index}><th scope="row">{resource.title}{review?<span className={styles.coverageSource}><a href={review.source} target="_blank" rel="noopener noreferrer">Review source</a> · {review.checkedAt}<span>{review.summary}</span></span>:<span className={styles.coverageSource}>{resource.link_status==="broken"?"Link unavailable":coverageReviewState(resource.url)==="expired"?"Coverage review expired · mapping withheld":"Curriculum not reviewed"}</span>}</th>{topics.map(t=><td key={t.id}>{review?.topics.includes(t.id)?"Mapped":"Not verified"}</td>)}</tr>;})}</tbody></table>
 </div></details>;
}
