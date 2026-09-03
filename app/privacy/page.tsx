export default function PrivacyPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 bg-grid-pattern py-16">
      <div className="glow-orb-indigo top-10 left-1/2 -translate-x-1/2" />

      <div className="relative mx-auto max-w-3xl glass-card rounded-3xl p-8 sm:p-12 border-slate-800 shadow-2xl space-y-6">
        <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400">Last updated: September 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white">1. Data We Collect</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Account Information:</strong> Email address, display name, companion avatar, and encrypted password credentials managed by Supabase Auth.</li>
              <li><strong className="text-slate-200">Roadmap Inputs:</strong> Target skill fields, self-reported experience level, weekly availability, budget limit, and quiz scores.</li>
              <li><strong className="text-slate-200">Progress Tracking:</strong> Marked stage completions, ratings, practice checks, and export timestamps.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">2. AI & Third-Party Integrations</h2>
            <p className="mt-1 text-slate-400">
              Your onboarding parameters are transmitted to Google Gemini API (with search grounding) to synthesize your learning stages and filter public YouTube and web resources.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">3. Data Control & Permanent Deletion</h2>
            <p className="mt-1 text-slate-400">
              You retain full control over your data. You can delete individual learning paths from your Dashboard or delete your entire account permanently via your Account Settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">4. Cookies & Security</h2>
            <p className="mt-1 text-slate-400">
              We use strictly necessary HTTP cookies for authentication sessions. Row Level Security (RLS) is enforced in our database to isolate user records.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
