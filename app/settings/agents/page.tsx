import { listOwnerAgentKeys } from "@/lib/agents/keys";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateAgentKeyForm, RevokeAgentKeyForm } from "@/components/AgentKeyForms";
export const metadata:Metadata = {title:"Agent access | LearningMap",robots:{index:false,follow:false}};
export default async function AgentAccessPage() {
  const client = await createClient();
  const {data:{user}} = await client.auth.getUser();
  if (!user) redirect("/login?next=%2Fsettings%2Fagents");
  const {keys,error} = await listOwnerAgentKeys(client,user.id);
  return <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8"><Link href="/settings" className="text-sm text-slate-300">← Account settings</Link><p className="mt-8 text-sm uppercase tracking-widest text-slate-400">Agent access</p><h1 className="mt-3 font-serif text-4xl font-semibold">Let your assistant learn with you.</h1><p className="mt-5 max-w-2xl text-slate-300">Create a separate key for each agent. You control which connections stay active.</p>
    <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8"><h2 className="text-2xl font-semibold">Create a connection</h2><p className="mt-3 leading-relaxed text-slate-300">Keys allow read-only catalog and curriculum access. Personal notes, saved progress, purchases and calendar actions stay private. Keys expire after 30 days. Signing out of the website does not revoke an agent key.</p><p className="mt-3 text-sm text-slate-400">Use up to five active keys. Configure your agent with an Authorization header: Bearer followed by your key. Never share your password or browser session.</p>{error?<p role="alert" className="mt-5 text-amber-300">Agent access is temporarily unavailable. Please retry shortly.</p>:!user.email_confirmed_at?<p role="alert" className="mt-5 text-amber-300">Verify your email before creating an agent key.</p>:<CreateAgentKeyForm/>}</section>
    <section className="mt-10" aria-labelledby="keys-title"><h2 id="keys-title" className="text-2xl font-semibold">Your connections</h2>{!error && !keys?.length && <p className="mt-4 text-slate-400">No agent keys yet.</p>}<ul className="mt-5 space-y-4">{keys?.map(key=>{const active=key.active;return <li key={key.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-700 p-5"><div><h3 className="break-all font-semibold">{key.label}</h3><p className="mt-2 text-sm text-slate-400">{key.revoked_at?"Revoked":active?"Active":"Expired"} · Catalog read access</p><p className="mt-1 text-sm text-slate-400">Expires {new Date(key.expires_at).toLocaleDateString("en",{timeZone:"UTC"})}</p></div><RevokeAgentKeyForm id={key.id} active={active}/></li>;})}</ul></section><Link href="/integrations" className="mt-8 inline-block underline underline-offset-4">View connection instructions</Link>
  </div>;
}
