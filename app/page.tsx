import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingRoadmapPreview } from "@/components/LandingRoadmapPreview";

export default async function Home() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (err) {
    user = null;
  }

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
            <div className="text-2xl font-extrabold text-indigo-400 sm:text-3xl">100 +</div>
            <div className="mt-1 text-xs font-medium text-slate-400">Roadmaps Generated</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-400 sm:text-3xl">100%</div>
            <div className="mt-1 text-xs font-medium text-slate-400">Budget Tailored</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-400 sm:text-3xl">99%</div>
            <div className="mt-1 text-xs font-medium text-slate-400">Verified Resource Safety</div>
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
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

      {/* Interactive Domain Preview Section */}
      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <LandingRoadmapPreview />
      </div>
    </div>
  );
}
