import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const FEATURES = [
    {
      icon: "🎯",
      title: "AI Skill Assessment",
      description: "Smart 5-question technical quiz to accurately gauge your starting point, whether you are a beginner or experienced developer.",
    },
    {
      icon: "⏱️",
      title: "Budget & Time Tailored",
      description: "Specify exact weekly hours and budget limit ($0 free tier or paid). Gemini selects the best matching high-quality resources.",
    },
    {
      icon: "📺",
      title: "Vetted YouTube & Web Content",
      description: "Automated link health checks, SSRF URL filtering, and trusted source scoring filter out broken or spammy links.",
    },
    {
      icon: "📅",
      title: "Calendar Sync & Tracking",
      description: "Track your stage-by-stage progress, attempt practice checks, and export your personal schedule to Apple, Google, or Outlook Calendar (.ics).",
    },
  ];

  const SAMPLE_STAGES = [
    {
      stage: "Stage 1",
      title: "HTTP Fundamentals & Web Standards",
      tag: "Free",
      hours: "4h",
      resource: "MDN Web Docs & freeCodeCamp",
    },
    {
      stage: "Stage 2",
      title: "Node.js Event Loop & Express APIs",
      tag: "Free",
      hours: "6h",
      resource: "Traversy Media / YouTube",
    },
    {
      stage: "Stage 3",
      title: "Database Modeling with PostgreSQL & Supabase",
      tag: "Free",
      hours: "8h",
      resource: "Supabase Official Guides",
    },
    {
      stage: "Stage 4",
      title: "Containerization with Docker & CI/CD Pipelines",
      tag: "Free",
      hours: "7h",
      resource: "Fireship & GitHub Actions Docs",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 bg-grid-pattern">
      {/* Background Glow Accents */}
      <div className="glow-orb-indigo -top-20 left-1/2 -translate-x-1/2 animate-pulse-glow" />
      <div className="glow-orb-purple top-96 -right-20" />

      {/* Hero Section */}
      <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
          Powered by Gemini 2.5 & Google Search Grounding
        </div>

        <h1 className="mt-8 font-serif text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-tight">
          Learn anything with a <br className="hidden sm:inline" />
          <span className="gradient-text">curated roadmap</span> tailored to you.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed sm:text-xl">
          Stop getting overwhelmed by endless tutorial loops. Tell us your goal, weekly hours, and budget — we create an optimized, step-by-step learning path from across the web.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/onboarding"
            className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold shadow-xl sm:w-auto"
          >
            <span>🚀</span> Build My Path Free
          </Link>
          <Link
            href="/signup"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-7 py-3.5 text-base font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 sm:w-auto"
          >
            <span>✨</span> Create Free Account
          </Link>
        </div>

        {/* Stats counter strip */}
        <div className="mt-16 grid grid-cols-2 gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-md sm:grid-cols-4">
          <div>
            <div className="text-2xl font-extrabold text-white sm:text-3xl">100+</div>
            <div className="mt-1 text-xs font-medium text-slate-400">Supported Tech Fields</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-indigo-400 sm:text-3xl">10,000+</div>
            <div className="mt-1 text-xs font-medium text-slate-400">Roadmaps Generated</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-400 sm:text-3xl">100%</div>
            <div className="mt-1 text-xs font-medium text-slate-400">Budget Tailored</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-400 sm:text-3xl">99.4%</div>
            <div className="mt-1 text-xs font-medium text-slate-400">Verified Resource Safety</div>
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to master a new skill
          </h2>
          <p className="mt-3 text-slate-400">
            Smart curriculum generation combined with real-world resource verification.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, idx) => (
            <div
              key={idx}
              className="glass-card glass-card-hover flex flex-col justify-between rounded-2xl p-6"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-2xl border border-indigo-500/20">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Roadmap Preview Card */}
      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="glass-card rounded-3xl p-8 border-indigo-500/30">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Sample Roadmap
              </span>
              <h3 className="mt-1 font-serif text-2xl font-bold text-white">
                Backend Engineering Path
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                ⏱️ 5 hrs/week
              </span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                💰 Free Resources
              </span>
            </div>
          </div>

          {/* Interactive stage steps */}
          <div className="mt-8 space-y-4">
            {SAMPLE_STAGES.map((s, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 transition hover:border-indigo-500/40 hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-xs font-bold text-indigo-400 border border-indigo-500/30">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{s.title}</h4>
                    <p className="text-xs text-slate-400">Resource: {s.resource}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 self-end sm:self-center">
                  <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300">{s.hours}</span>
                  <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-indigo-300 border border-indigo-500/20">{s.tag}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/onboarding"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
            >
              <span>✨</span> Generate Your Custom Path
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
