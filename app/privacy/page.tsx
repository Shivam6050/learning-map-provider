export default function PrivacyPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 bg-grid-pattern py-16">
      <div className="glow-orb-indigo top-10 left-1/2 -translate-x-1/2" />

      <div className="relative mx-auto max-w-3xl glass-card rounded-3xl p-8 sm:p-12 border-slate-800 shadow-2xl space-y-6">
        <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400">Last updated: October 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white">1. Data We Collect</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Account Information:</strong> Email address, country of residence, mobile number when verification is enabled, display name, companion avatar, and password credentials managed by Supabase Auth.</li>
              <li><strong className="text-slate-200">Roadmap Inputs:</strong> Target skill fields, self-reported experience level, weekly availability, budget limit, and quiz scores.</li>
              <li><strong className="text-slate-200">Progress Tracking:</strong> Marked stage completions, ratings, practice checks, and export timestamps.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">2. AI & Third-Party Integrations</h2>
            <p className="mt-1 text-slate-400">
              Verification messages are delivered through Supabase Auth and its configured email and SMS providers. Phone numbers are used for verification, not marketing. Your onboarding parameters are transmitted to Google Gemini API (with search grounding) to synthesize your learning stages and filter public YouTube and web resources.
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
              We use strictly necessary cookies for authentication. Session tokens are held in HTTP-only cookies, and private account responses are not cached. Database ownership rules isolate profiles, saved roadmaps, progress and notes from other users, including application administrators. Our trusted backend and infrastructure providers process account data to operate the service. Optional bots receive access only to the course catalog, never your profile or private learning records.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">5. Google Calendar</h2>
            <p className="mt-1 text-slate-400">Connecting Google Calendar is optional and separate from signing in. With your permission, LearningMap creates timed study sessions in your primary Google calendar when you select Add sessions. We send Google the learning field, stage title and description, session times, time zone, and identifiers used to prevent duplicate imports. When retrying an import, we read the matching event to confirm it belongs to that roadmap. We do not scan your calendar for unrelated events.</p>
            <p className="mt-2 text-slate-400">The requested permission allows access to events on calendars you own. Our implementation uses it only for the study schedule you request. Your Google access token is kept in an encrypted, HTTP-only connection cookie for at most one hour. We do not store a refresh token or provide ongoing calendar sync.</p>
            <p className="mt-2 text-slate-400">Google Calendar data is not sent to Gemini, used to train AI models, sold, or used for advertising. LearningMap’s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="underline">Google API Services User Data Policy</a>, including its Limited Use requirements.</p>
            <p className="mt-2 text-slate-400">You can revoke access through <a href="https://myaccount.google.com/connections" className="underline">your Google Account connections</a> and delete imported study events in Google Calendar. Revoking access, clearing connection cookies, or deleting a LearningMap roadmap does not delete events already imported into Google Calendar. For privacy questions, contact <a href="mailto:60shivam50@gmail.com" className="underline">60shivam50@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
