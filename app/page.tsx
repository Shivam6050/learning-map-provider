import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FIELD_CATALOG } from "@/lib/fields/catalog";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return <div className="atlas-home">
    <section className="atlas-hero">
      <div className="atlas-intro">
        <p className="atlas-eyebrow">A little direction. A lot of possibility.</p>
        <h1>Your next chapter<br/>starts with<br/><em>a clear path.</em></h1>
        <p className="atlas-description">Turn “I want to learn” into “I know what’s next.” Find a learning route that fits your starting point, your week, and your budget.</p>
        <div className="atlas-actions"><Link className="atlas-button" href="/onboarding">Find my learning path <span aria-hidden="true">↗</span></Link><a href="#explore" className="atlas-text-link">Explore the fields ↓</a></div>
        <p className="atlas-footnote">Start from scratch. Build on what you know. Go deeper.</p>
      </div>
      <div className="atlas-map" aria-label="Example frontend learning journey">
        <div className="atlas-map-heading"><span>THE JOURNEY / 001</span><span className="atlas-tag">Example roadmap</span></div>
        <h2>From curious<br/>to creating.</h2>
        <div className="atlas-map-meta"><span>Frontend development</span><span>Beginner · 5 hrs / week</span></div>
        <ol className="atlas-route">
          <li><span className="atlas-node">01</span><div><small>BUILD YOUR FOUNDATION</small><h3>Understand the web</h3><p>HTML, CSS & your first page</p></div><span className="atlas-route-label">Start here</span></li>
          <li><span className="atlas-node">02</span><div><small>MAKE IT INTERACTIVE</small><h3>Think in JavaScript</h3><p>Logic, events & small experiments</p></div></li>
          <li><span className="atlas-node">03</span><div><small>PUT IT INTO PRACTICE</small><h3>Build something yours</h3><p>A working project for your portfolio</p></div></li>
        </ol>
        <div className="atlas-map-footer"><span>Learn → Practice → Make progress</span><span aria-hidden="true">✳</span></div>
      </div>
    </section>
    <section className="atlas-principles" aria-label="How it works">
      {[['01','Start where you are','Choose your level, or take a short field-specific quiz to find your starting point.'],['02','Choose your pace','Set your weekly hours and spending limit. Compare different ways to reach your goal.'],['03','Keep moving forward','Follow clear milestones, practise each skill, and see your progress build.']].map(([n,t,d])=><article key={n}><span>{n}</span><h2>{t}</h2><p>{d}</p></article>)}
    </section>
    <section className="atlas-explore" id="explore"><div className="atlas-section-heading"><div><p className="atlas-eyebrow">PICK A DIRECTION</p><h2>What will you learn next?</h2></div><p>Six fields. Your own way forward.</p></div>
      <div className="atlas-fields">{FIELD_CATALOG.map((field,i)=><Link key={field.slug} href={'/onboarding?field='+field.slug}><span className="atlas-field-number">0{i+1}</span><h3>{field.name}</h3><p>Learning paths · Skill assessment</p><span className="atlas-field-arrow" aria-hidden="true">↗</span></Link>)}</div>
    </section>
    <section className="atlas-note"><span aria-hidden="true">✳</span><div><h2>A plan that respects your budget.</h2><p>Free resources are always an option. Paid courses enter your plan only when we can obtain a price; estimates may differ from the provider’s final checkout.</p></div><Link className="atlas-text-link" href="/onboarding">Set my budget ↗</Link></section>
  </div>;
}
