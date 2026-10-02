import {curriculumUnit} from "./authored-curriculum";
import {stageTopics} from "./topics";
export function projectMilestones(title:string,description:string|null) {
 const unit=curriculumUnit(title);
 const topics=stageTopics(title,description);
 return [
  {id:"build",title:"Build a demonstrable outcome",criterion:unit?.project??("Complete the stage challenge, or create a small example demonstrating "+title+". Keep the output or a link to your work.")},
  {id:"verify",title:"Verify the result",criterion:"Record reproducible steps showing the expected result and one failure or boundary case. "+topics[0].criterion},
  {id:"explain",title:"Explain your decisions",criterion:"In your project notes, describe one decision or tradeoff, the result of your checks, and what you would improve next."},
 ];
}
