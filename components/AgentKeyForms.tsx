"use client";
import { useActionState, useState } from "react";
import { createAgentKey, revokeAgentKey, type AgentKeyState } from "@/app/settings/agents/actions";
const button = "rounded-lg bg-slate-100 px-5 py-3 font-medium text-slate-950 disabled:opacity-50";
export function CreateAgentKeyForm() {
  const [state,action,pending] = useActionState(createAgentKey,{} as AgentKeyState);
  const [visible,setVisible] = useState(false);
  const [copied,setCopied] = useState(false);
  return <div><form action={action} className="mt-6 space-y-5">
    <div><label htmlFor="agent-label" className="block text-sm text-slate-300">Agent name</label><input id="agent-label" name="label" autoComplete="off" required maxLength={80} placeholder="For example, my research assistant" className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3"/></div>
    <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-300"><input name="consent" type="checkbox" required className="mt-1"/>I allow this agent to read LearningMap’s catalog and curriculum previews using this key.</label>
    <button type="submit" disabled={pending} aria-busy={pending} className={button}>{pending ? "Creating key…" : "Create agent key"}</button>
  </form>{state.error && <p role="alert" className="mt-4 text-amber-300">{state.error}</p>}{state.message && <p role="status" className="mt-4 text-slate-300">{state.message}</p>}
  {state.key && <div className="mt-5 rounded-xl border border-slate-600 bg-slate-950 p-4"><label htmlFor="agent-secret" className="text-sm text-slate-300">Your agent key — keep it private</label><input id="agent-secret" name="agentSecret" type={visible?"text":"password"} value={state.key} readOnly autoComplete="off" spellCheck={false} className="mt-2 w-full rounded-md border border-slate-600 bg-slate-900 p-3 font-mono text-sm"/><div className="mt-4 flex flex-wrap gap-4"><button type="button" onClick={()=>setVisible(value=>!value)} className="underline underline-offset-4">{visible?"Hide key":"Show key"}</button><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(state.key!);setCopied(true);}catch{setVisible(true);setCopied(false);}}} className="underline underline-offset-4">Copy key</button></div>{copied && <p role="status" className="mt-3 text-sm">Key copied.</p>}</div>}</div>;
}
export function RevokeAgentKeyForm({id,active}:{id:string;active:boolean}) {
  const [state,action,pending] = useActionState(revokeAgentKey,{} as AgentKeyState);
  return <form action={action}><input type="hidden" name="keyId" value={id}/>{active && <button type="submit" disabled={pending} aria-busy={pending} className="rounded-md border border-slate-600 px-4 py-2 text-sm disabled:opacity-50">{pending?"Revoking…":"Revoke key"}</button>}{state.error && <p role="alert" className="mt-2 text-sm text-amber-300">{state.error}</p>}{state.message && <p role="status" className="mt-2 text-sm">{state.message}</p>}</form>;
}
