export type LastResource={stageId:string;resourceId:string;openedAt?:string};
export const resourceEvent="learningmap-resource-opened";
export function resourceStorageKey(viewerId:string,pathId:string){return "learningmap:last-resource:"+viewerId+":"+pathId;}
export function rememberResource(viewerId:string,pathId:string,stageId:string,resourceId:string) {
 try{localStorage.setItem(resourceStorageKey(viewerId,pathId),JSON.stringify({stageId,resourceId,openedAt:new Date().toISOString()}));window.dispatchEvent(new Event(resourceEvent));}catch{/* Browsing remains available when storage is disabled. */}
}
export function parseLastResource(value:string|null):LastResource|null {
 try{const parsed=JSON.parse(value??"null");return typeof parsed?.stageId==="string"&&typeof parsed?.resourceId==="string"?{stageId:parsed.stageId,resourceId:parsed.resourceId,...(typeof parsed.openedAt==="string"&&Number.isFinite(Date.parse(parsed.openedAt))?{openedAt:parsed.openedAt}:{})}:null;}catch{return null;}
}
