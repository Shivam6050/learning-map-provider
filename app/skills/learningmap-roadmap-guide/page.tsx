import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
import { publicPageMetadata } from "@/lib/seo";

const path = "/skills/learningmap-roadmap-guide";
export const metadata: Metadata = {
  ...publicPageMetadata(path, "LearningMap Roadmap Guide for AI Agents | MCP Learning Resources", "Use LearningMap from compatible AI agents to explore backend, frontend, full-stack, AI, data science and DevOps curricula with curated learning resources."),
  keywords: ["LearningMap AI skill", "MCP learning roadmap", "AI agent study plan", "backend development roadmap", "frontend development roadmap", "full-stack curriculum", "curated technology courses"],
};

export default function LearningMapAgentSkillPage() {
  const site = getSiteUrl();
  const rawSkill = site + "/skills/learningmap-roadmap-guide/SKILL.md";
  const zip = site + "/downloads/learningmap-roadmap-guide.zip";
  return <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
    <p className="text-sm uppercase tracking-widest text-emerald-300">For AI agents · open skill format</p>
    <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold text-white sm:text-5xl">LearningMap Roadmap Guide for AI Agents</h1>
    <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">Explore structured technology learning roadmaps and curated resources from compatible AI assistants. The LearningMap skill works with a separate authenticated MCP connection, keeping the agent access scoped to catalog reading.</p>
    <div className="mt-8 flex flex-wrap gap-3">
      <a className="rounded-xl bg-emerald-300 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-200" href="/downloads/learningmap-roadmap-guide.zip" download>Download the skill ZIP</a>
      <a className="rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-100 hover:bg-slate-800" href="/skills/learningmap-roadmap-guide/SKILL.md">Read SKILL.md</a>
    </div>
    <section className="mt-12 rounded-2xl border border-slate-700 bg-slate-900/70 p-6 sm:p-8" aria-labelledby="coverage">
      <h2 id="coverage" className="text-2xl font-semibold">What it covers</h2>
      <p className="mt-3 leading-relaxed text-slate-300">The read-only catalog includes Backend Development, Frontend Development, Full-Stack Development, AI &amp; Machine Learning, Data Science, and DevOps &amp; Cloud at beginner, intermediate, and advanced levels.</p>
      <ul className="mt-5 list-disc space-y-2 pl-5 text-slate-300">
        <li>Read authored curriculum previews with stages, project prompts and estimated effort.</li>
        <li>Search curated learning resources by topic.</li>
        <li>Turn returned outlines into clear study sequences while preserving their links and limits.</li>
      </ul>
    </section>
    <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 sm:p-8" aria-labelledby="connection">
      <h2 id="connection" className="text-2xl font-semibold">Skill installation and server connection are separate</h2>
      <p className="mt-3 leading-relaxed text-slate-300">Downloading or invoking a skill does not sign you in or connect the MCP server. Each AI client must support the SKILL.md format and remote MCP over Streamable HTTP with a custom Authorization header. Connect the server at <code className="break-all">https://learning-map-provider-bice.vercel.app/mcp</code>, then store your LearningMap agent key in the client’s private credential settings.</p>
      <p className="mt-3 leading-relaxed text-slate-300">To create a key, sign in with a verified email, open Settings → Agent access, and confirm your account password. Never paste passwords, browser cookies or agent keys into a chat.</p>
      <Link className="mt-5 inline-block underline underline-offset-4" href="/integrations">See the complete connection guide →</Link>
    </section>
    <section className="mt-10" aria-labelledby="limits">
      <h2 id="limits" className="text-2xl font-semibold">What it does not do</h2>
      <p className="mt-3 leading-relaxed text-slate-300">The MCP integration cannot read personal saved paths, notes, progress, account data or calendars. It cannot save a personalized path or make purchases. Resource availability and regional course prices are not verified live; confirm current details with the provider.</p>
    </section>
    <nav aria-label="LearningMap AI skill resources" className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-800 pt-6 text-slate-300">
      <a className="underline underline-offset-4" href={rawSkill}>Raw SKILL.md</a>
      <a className="underline underline-offset-4" href={zip}>Skill ZIP</a>
      <a className="underline underline-offset-4" href={site + "/llms.txt"}>Agent-readable guide</a>
      <Link className="underline underline-offset-4" href="/roadmaps">Browse public roadmaps</Link>
    </nav>
  </article>;
}