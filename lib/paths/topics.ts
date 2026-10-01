export type LearningTopic = {id:string;title:string;criterion:string};
// Original topic guidance. Match the stage itself, never infer coverage from a course title.
const catalog: [string,RegExp,string,string][] = [
 ["http",/\bhttp|restful|\brest\b|api design/i,"HTTP and API contracts","Explain request methods, status codes and the contract your endpoint exposes."],
 ["data",/database|\bsql\b|postgres|schema|\borm\b|data model/i,"Data modelling and queries","Describe the data model and demonstrate a query or operation relevant to this stage."],
 ["auth",/authenticat|authoriz|session|ownership|security/i,"Identity and access boundaries","Explain who can access the data and demonstrate both allowed and denied access."],
 ["testing",/test|validation|reproducib|evaluation/i,"Verification and failure cases","Show a reproducible check for the expected result and at least one failure case."],
 ["delivery",/deploy|docker|container|release|rollback|ci\s*[/ ]\s*cd/i,"Delivery and recovery","Explain how the work is deployed and how you would recover from a failed release."],
 ["performance",/performance|caching|cache|latency|scal|throughput/i,"Performance and measurement","Measure the relevant behaviour before and after a change; explain the tradeoff."],
 ["interface",/react|frontend|interface|accessib|\bcss\b|\bhtml\b/i,"Interface behaviour","Demonstrate the intended interaction, including a small-screen or keyboard check."],
 ["analysis",/dataset|statistics|machine learning|prediction model|analysis|metric|prediction/i,"Evidence and assumptions","Explain the assumptions and show evidence supporting the result, including its limitations."],
];
export function stageTopics(title:string,description:string|null):LearningTopic[] {
 const text=title+" "+(description??"");
 const matches=catalog.filter(([,pattern])=>pattern.test(text)).slice(0,5).map(([id,,name,criterion])=>({id,title:name,criterion}));
 return matches.length?matches:[{id:"foundations",title:"Understand the core concepts",criterion:"Explain this stageâ€™s main concepts in your own words and demonstrate one relevant example."}];
}
export const projectCriteria = ["Demonstrate this stage’s outcome through a relevant example or practice project.","Include reproducible steps or checks showing that the result works.","Explain one decision, limitation, or tradeoff in your project notes."];
