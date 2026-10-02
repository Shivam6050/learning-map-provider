import {stageTopics} from "./topics";
export type OptionalExercise={title:string;description:string};
const extensions:Record<string,OptionalExercise>={
 http:{title:"Explore API versioning",description:"Compare two ways to evolve an endpoint without breaking an existing client."},
 data:{title:"Inspect a query plan",description:"Inspect how a database executes a query and explain whether an index would help."},
 auth:{title:"Review a threat scenario",description:"Describe how a stolen session or an incorrect permission check could affect your example."},
 testing:{title:"Test a boundary case",description:"Add a check for an unusual input or dependency failure and explain the expected behaviour."},
 delivery:{title:"Rehearse a rollback",description:"Describe or practise returning to the previous working version after a failed release."},
 performance:{title:"Compare a second approach",description:"Measure an alternative implementation and document the cost of the improvement."},
 interface:{title:"Check an unfamiliar interaction",description:"Try your example with keyboard navigation and a narrow screen, then record one improvement."},
 analysis:{title:"Challenge an assumption",description:"Change one assumption or inspect a subset of the data and explain how the conclusion changes."},
};
export function optionalExercises(title:string,description:string|null):OptionalExercise[]{
 const groups:Record<string,string>={http:"http",api:"http",sql:"data",auth:"auth",security:"auth",ci:"delivery",docker:"delivery",ops:"delivery",iac:"delivery",k8s:"delivery",web:"performance",react:"interface",ui:"interface",html:"interface",css:"interface",data:"analysis",stats:"analysis",ml:"analysis"};
 const selected=stageTopics(title,description).flatMap(topic=>{const extension=extensions[topic.id]??extensions[groups[topic.id.split(".")[0]]];return extension?[extension]:[];});
 return selected.filter((item,index)=>selected.findIndex(other=>other.title===item.title)===index).slice(0,2);
}
export function startingGuidance(level:string|undefined):string {
 if(level==="advanced")return "Review the stage outcome first. If you can already demonstrate it, use the practice task to check your understanding before moving on.";
 if(level==="intermediate")return "Check the core concepts against what you already know. Use the learning resources to fill gaps before the practice task.";
 return "Start with the highlighted resource and work through the core concepts before attempting the practice task. Keep notes on anything unfamiliar.";
}
