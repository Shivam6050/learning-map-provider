"use client";
import {curriculumUnit,topicDefinitions} from "@/lib/paths/authored-curriculum";
import {optionalExercises,startingGuidance} from "@/lib/paths/preparation";
import type {RoadmapStage} from "@/lib/paths/stage";
import styles from "./Roadmap.module.css";
export function StagePreparation({stage,previous,level}:{stage:RoadmapStage;previous?:RoadmapStage;level?:string}) {
 const unit=curriculumUnit(stage.title);
 const exercises=optionalExercises(stage.title,stage.description);
 return <section className={styles.preparation} aria-labelledby={"preparation-"+stage.id}>
  <h3 id={"preparation-"+stage.id}>Before you begin</h3>
  {previous?<><p>This roadmap places <strong>{previous.title}</strong> before this stage. Review its outcome if you need a refresher.</p><a className={styles.preparationLink} href={"#stage-"+previous.id} onClick={()=>window.dispatchEvent(new CustomEvent("roadmap-navigate",{detail:previous.id}))}>{previous.stage_progress?.[0]?.status==="completed"?"Review completed stage":"Review preceding stage"}<span aria-hidden="true"> ↗</span></a><p className={styles.preparationNote}>Suggested preparation based on your roadmap order; it does not lock this stage.</p></>:<p>{startingGuidance(level)}</p>}
  {unit&&unit.prerequisiteIds.length>0&&<div><p>Preparation checks for this curriculum:</p><ul>{unit.prerequisiteIds.map(id=><li key={id}>{topicDefinitions[id][0]}: {topicDefinitions[id][1]}</li>)}</ul></div>}
  {exercises.length>0&&<details className={styles.optionalLearning}><summary>Optional exploration <span>{exercises.length} ideas</span></summary><p>For extra practice when you have time. These ideas are not required for stage completion.</p><ul>{exercises.map(exercise=><li key={exercise.title}><strong>{exercise.title}</strong><p>{exercise.description}</p></li>)}</ul></details>}
 </section>;
}
