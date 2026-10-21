import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { HOME_DESCRIPTION, HOME_TITLE, publicPageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";

export const metadata = publicPageMetadata("/", HOME_TITLE, HOME_DESCRIPTION);

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return <div className="atlas-home">
    <JsonLd data={{ "@context": "https://schema.org", "@graph": [
      { "@type": "Organization", "@id": getSiteUrl() + "/#organization", name: "LearningMap", alternateName: "Learning Map", url: getSiteUrl(), description: HOME_DESCRIPTION,
        logo: { "@type": "ImageObject", url: getSiteUrl() + "/learningmap-logo.png", width: 192, height: 192 },
        sameAs: ["https://github.com/Shivam6050/learning-map-provider"] },
      { "@type": "WebSite", "@id": getSiteUrl() + "/#website", name: "LearningMap", alternateName: "Learning Map", url: getSiteUrl(), description: HOME_DESCRIPTION, inLanguage: "en", publisher: { "@id": getSiteUrl() + "/#organization" } },
    ] }} />
    <section className="atlas-hero">
      <div className="atlas-intro">
        <p className="atlas-eyebrow">LearningMap / Personalized learning roadmaps</p>
        <h1>Your learning map.<br/>A clear path<br/><em>to what’s next.</em></h1>
        <p className="atlas-description">LearningMap turns your goals into a personal learning map. Explore frontend, backend, full-stack development and more, with courses and practice matched to your level, weekly hours and budget.</p>
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
      <div className="atlas-fields">{FIELD_CATALOG.map((field,i)=><Link key={field.slug} href={'/roadmaps/'+field.slug}><span className="atlas-field-number">0{i+1}</span><h3>{field.name}</h3><p>Roadmap guide · Topics & projects</p><span className="atlas-field-arrow" aria-hidden="true">↗</span></Link>)}</div>
    </section>
    <section className="atlas-questions" aria-labelledby="learning-map-explained">
      <div>
        <p className="atlas-eyebrow">A little clarity before you begin</p>
        <h2 id="learning-map-explained">What is a learning map?</h2>
        <p className="atlas-questions-intro">A learning map connects a goal to the skills, resources and practice needed to reach it. It gives you an order to follow, so each new topic builds on what you already know.</p>
        <Link className="atlas-text-link" href="/roadmaps">Explore the learning roadmap guides ↗</Link>
      </div>
      <div className="atlas-answers">
        <details>
          <summary>How does LearningMap build my path?</summary>
          <p>Choose a field and your starting level, or take its knowledge check. Set your weekly study hours and course budget. Your personal roadmap organizes milestones, learning resources and practical projects around those choices.</p>
        </details>
        <details>
          <summary>Can I use free learning resources?</summary>
          <p>Yes. A free route is available alongside budget-based options. Paid courses are optional; check the provider’s current price, billing period and regional offer before buying. You can browse the public curriculum guides before creating an account.</p>
        </details>
        <details>
          <summary>Is a learning roadmap the same as a mind map?</summary>
          <p>A mind map groups related ideas. A learning roadmap puts skills in a sequence, adds practice and shows what to work on next. LearningMap helps you follow that sequence; it is not a mind-map drawing editor.</p>
        </details>
      </div>
    </section>
    <section className="atlas-note"><span aria-hidden="true">✳</span><div><h2>A plan that respects your budget.</h2><p>Free resources are always an option. Paid courses enter your plan only when we can obtain a price; estimates may differ from the provider’s final checkout.</p></div><Link className="atlas-text-link" href="/onboarding">Set my budget ↗</Link></section>
  </div>;
}
