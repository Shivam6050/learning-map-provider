"use client";
import { courseLink } from "@/lib/affiliates/links";
import { providerName } from "@/lib/web-discovery/providers";
import type { ReplacementOptionsState } from "@/lib/paths/resource-management";
import { Money } from "./CurrencyProvider";
import { W3SchoolsOffer } from "./W3SchoolsOffer";
import styles from "./ResourceTools.module.css";
export function ReplacementChoices({loaded,selection,owned,busy,onSelect,onOwnedChange}:{
 loaded:ReplacementOptionsState;selection:string;owned:boolean;busy:boolean;
 onSelect:(id:string,alreadyOwned:boolean)=>void;onOwnedChange:(owned:boolean)=>void;
}) {
 const selected=loaded.options.find(option=>option.id===selection);
 return <><fieldset disabled={busy} className={styles.options}><legend>Choose a replacement</legend>{loaded.options.map(option=>{
      const outgoing=courseLink(option.url);
      return <label key={option.id} className={styles.option}>
       <input type="radio" name="replacementId" value={option.id} required checked={selection===option.id} onChange={()=>onSelect(option.id,option.alreadyOwned&&!option.libraryOwned)}/>
       <span><small>{providerName(option.url)}{option.previouslyUsed?" · Previously used in this stage":""}</small><strong>{option.title}</strong><span>{option.priceUnknown?"Price needs confirmation":<Money amount={option.price} currency={option.currency} freeLabel/>}{option.billingInterval==="year"?" / year, billed upfront":option.billingInterval==="month"?" / month":""}</span>{outgoing.href&&<a href={outgoing.href} target="_blank" rel={outgoing.affiliate?"sponsored noopener noreferrer":"noopener noreferrer"}>View resource <span aria-hidden="true">↗</span></a>}</span>
      </label>;
     })}</fieldset>
     {selected&&<div className={styles.preview} aria-live="polite">
      <strong>After this change</strong>
      <span>Roadmap budget: <Money amount={loaded.budget??0} currency={loaded.currency??selected.currency}/></span>
      <span>New purchases estimate: {(owned?selected.ownedTotalUnknown:selected.totalUnknown)?"Some prices need confirmation":<Money amount={owned?selected.ownedCost:selected.plannedCost} currency={selected.currency}/>}</span>
      {selected.requiresOwnership&&!owned&&<p>This paid option needs price confirmation or cannot fit within your budget. Only include it if you already have access.</p>}
      {selected.libraryOwned?<p>Covered by your library for this study period. Its expiry will continue to apply; no permanent ownership is recorded.</p>:<><label className={styles.owned}><input type="checkbox" name="alreadyOwned" checked={owned} disabled={busy||selected.alreadyOwned} onChange={event=>onOwnedChange(event.target.checked)}/><span>I already own this course or have active access. This is my own confirmation.</span></label>
      {selected.alreadyOwned&&<input type="hidden" name="alreadyOwned" value="on"/>}</>}
      <W3SchoolsOffer url={selected.url}/>
      <p>LearningMap may earn a commission from some provider links. Replacements are matched by relevance; existing calendar sessions are unchanged.</p>
     </div>}</>;
}
