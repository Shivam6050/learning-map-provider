export default function TermsPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 bg-grid-pattern py-16">
      <div className="glow-orb-purple top-10 left-1/2 -translate-x-1/2" />

      <div className="relative mx-auto max-w-3xl glass-card rounded-3xl p-8 sm:p-12 border-slate-800 shadow-2xl space-y-6">
        <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-400">Last updated: September 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p className="mt-1 text-slate-400">
              By accessing Learning Map (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">2. Scope of Service</h2>
            <p className="mt-1 text-slate-400">
              Learning Map provides AI-generated educational roadmaps and links to public third-party learning materials (YouTube videos, documentation sites, tutorials). Roadmaps are recommendations designed to guide self-study.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">3. Third-Party Content & Resources</h2>
            <p className="mt-1 text-slate-400">
              Third-party educational content is hosted independently by creators and platforms. We run automated link health verifications, but do not own or endorse third-party content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">4. User Account & Conduct</h2>
            <p className="mt-1 text-slate-400">
              You are responsible for maintaining account security. Automated scraping, rate-limit bypassing, or unauthorized access attempts are strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">5. Disclaimer of Warranties</h2>
            <p className="mt-1 text-slate-400">
              The Service is provided &quot;as is&quot; without warranties of any kind. AI recommendations are generated dynamically based on user preferences.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
