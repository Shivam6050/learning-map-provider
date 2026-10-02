export function resumeStage<T extends {status:string;updatedAt?:string|null}>(stages:T[]):T|undefined {
 const active=stages.filter(stage=>stage.status==="in_progress");
 const timestamp=(value:string|null|undefined)=>{const parsed=Date.parse(value??"");return Number.isFinite(parsed)?parsed:0;};
 return [...active].sort((a,b)=>timestamp(b.updatedAt)-timestamp(a.updatedAt))[0]??stages.find(stage=>stage.status!=="completed");
}
