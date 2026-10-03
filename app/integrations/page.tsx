import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
export const metadata: Metadata = { title: "Connect your assistant | LearningMap", description: "Browse LearningMap's public curriculum and resources with MCP-compatible assistants or the public JSON catalog." };
export default function IntegrationsPage() {
  const endpoint = getSiteUrl() + "/mcp";
  return <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
    <p className="text-sm uppercase tracking-widest text-slate-400">LearningMap for assistants</p>
    <h1 className="mt-4 font-serif text-4xl font-semibold text-white">A clearer path, wherever you learn.</h1>
    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">Connect an MCP-compatible assistant to explore our learning fields, curriculum outlines and curated resources.</p>
    <section className="mt-10 rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:p-8" aria-labelledby="connect-heading">
      <h2 id="connect-heading" className="text-2xl font-semibold">Connect your assistant</h2>
      <ol className="mt-5 list-decimal space-y-3 pl-5 text-slate-300"><li>Open your assistant’s MCP server or connector settings.</li><li>Add a remote server using Streamable HTTP and the address below.</li><li>Select no authentication. This connection only serves public content.</li></ol>
      <p className="mt-6 text-sm text-slate-400">Server address</p><code className="mt-2 block break-all rounded-lg border border-slate-700 p-4 text-slate-100">{endpoint}</code>
      <p className="mt-4 text-sm text-slate-400">Client support varies. This does not automatically register LearningMap with Grok, Dots or another bot.</p>
    </section>
    <section className="mt-10" aria-labelledby="tools-heading"><h2 id="tools-heading" className="text-2xl font-semibold">What your assistant can explore</h2><ul className="mt-5 list-disc space-y-3 pl-5 text-slate-300"><li>Six learning fields and three experience levels.</li><li>Authored curriculum previews with projects and estimated study hours.</li><li>Curated learning resources searchable by title and topic.</li></ul><p className="mt-5 text-slate-400">Previews are not saved or personalized roadmaps. Resource availability and free access are not checked live; confirm current terms on the provider website.</p></section>
    <section className="mt-10" aria-labelledby="privacy-heading"><h2 id="privacy-heading" className="text-2xl font-semibold">Your learning stays yours</h2><p className="mt-4 text-slate-300">This integration cannot read your account, notes or saved progress, purchase courses, send emails, or change your calendar. Personal account access is not available through this public connection.</p></section>
    <nav aria-label="Integration resources" className="mt-10 flex flex-wrap gap-6 text-slate-200"><a className="underline underline-offset-4" href="/api/public/catalog">JSON catalog</a><a className="underline underline-offset-4" href="/llms.txt">Agent guide</a><Link className="underline underline-offset-4" href="/onboarding">Build your own roadmap</Link></nav>
  </div>;
}
