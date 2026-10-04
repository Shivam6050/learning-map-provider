import Link from "next/link";
import { notFound } from "next/navigation";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { getPublicGuide } from "@/lib/fields/public-guides";
import { topicDefinitions, type CurriculumUnit } from "@/lib/paths/authored-curriculum";
import { breadcrumbData, publicPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import styles from "../roadmaps.module.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const guide = getPublicGuide((await params).slug);
  if (!guide) notFound();
  return publicPageMetadata(`/roadmaps/${guide.slug}`, `${guide.name} Roadmap & Course Planning | LearningMap`, guide.summary);
}

function Stages({ units }: { units: CurriculumUnit[] }) {
  return <ol className={styles.stages}>{units.map((unit, index) => <li className={styles.stage} key={unit.id}>
    <span className={styles.node} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    <h3>{unit.title}</h3>
    <ul className={styles.topics} aria-label="Skills to practise">{unit.topicIds.map(id => <li className={styles.topic} key={id}>{topicDefinitions[id][0]}</li>)}</ul>
    <p><strong>Put it into practice</strong>{unit.project}</p>
  </li>)}</ol>;
}

export default async function RoadmapGuidePage({ params }: Props) {
  const guide = getPublicGuide((await params).slug);
  if (!guide) notFound();
  const href = `/onboarding?field=${guide.slug}`;
  return <div className={styles.page}><div className={styles.container}>
    <JsonLd data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Learning roadmaps", path: "/roadmaps" }, { name: guide.name, path: `/roadmaps/${guide.slug}` }])} />
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/roadmaps">Learning roadmaps</Link><span aria-hidden="true">/</span><span>{guide.name}</span></nav>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>The learning guide / {guide.name}</p>
      <h1>{guide.name} roadmap</h1>
      <p>{guide.summary}</p>
      <div className={styles.actions}><Link className={styles.button} href={href}>Make this path mine <span aria-hidden="true">↗</span></Link><a className={styles.link} href="#curriculum">See the learning sequence</a></div>
    </header>
    <div className={styles.body}>
      <div>
        <section><h2 className={styles.eyebrow}>Where to begin</h2><p className="mt-4 leading-8">{guide.startingPoint}</p></section>
        <section className={styles.section} id="curriculum">
          <h2>The beginner learning sequence</h2>
          <p>Use these milestones as a starting point. Build each project and explain the decisions you made before moving on. This is a curriculum preview, not a saved or personalized path.</p>
          <Stages units={guide.units.filter(unit => unit.level === "beginner")} />
        </section>
        <section className={styles.section}>
          <h2>Already have the foundations?</h2>
          <p>Explore the next levels, or take LearningMap’s field-specific quiz when creating a path to check your starting point.</p>
          {(["intermediate", "advanced"] as const).map(level => <details className={styles.details} key={level}>
            <summary>{level === "intermediate" ? "Intermediate" : "Advanced"} milestones</summary>
            <Stages units={guide.units.filter(unit => unit.level === level)} />
          </details>)}
        </section>
        <section className={styles.section}>
          <h2>Finding {guide.name.toLowerCase()} courses</h2>
          <p>A good course should help you practise the skills in a milestone, not simply repeat a long list of tools. Compare prerequisites, project work and access terms before enrolling. Pair lessons with documentation and your own experiments.</p>
          <p>When you create a LearningMap path, you can compare a route near your budget, a balanced route and a free route. Paid course availability and reliable regional prices determine what can be included. Provider subscriptions and one-time purchases have different costs; always check the final checkout.</p>
          <Link className={styles.link} href={href}>Choose my level, study hours and course budget ↗</Link>
        </section>
        <section className={styles.section}>
          <h2>Questions before you start</h2>
          <details className={styles.details}><summary>Can I learn with free resources?</summary><p>LearningMap keeps a free route available. Paid courses are optional. Match each resource to a skill you need, complete the practice work and confirm the provider’s current access terms.</p></details>
          <details className={styles.details}><summary>How long will this roadmap take?</summary><p>There is no fixed completion time for this preview. Your personalized path uses your weekly hours and estimated stage work to plan a pace. Prior experience, practice and revision can change how long you need.</p></details>
          <details className={styles.details}><summary>What if I am unsure of my level?</summary><p>Choose this field in the path builder and take the knowledge check. Your answers help select a starting level; the result is a learning guide rather than a professional certification.</p></details>
        </section>
      </div>
      <aside className={styles.aside} aria-label="Personalize this roadmap">
        <p className={styles.eyebrow}>Your next chapter</p><h2>Learn toward something real.</h2><p>{guide.outcome}</p>
        <ul><li>Check your starting level</li><li>Set your weekly study time</li><li>Compare free and paid resources</li><li>Save milestones and track progress</li></ul>
        <Link className={styles.button} href={href}>Create my roadmap ↗</Link>
      </aside>
    </div>
    <section className={styles.section}><h2>Explore another direction</h2><nav className={styles.related} aria-label="Related learning roadmaps">{FIELD_CATALOG.filter(field => field.slug !== guide.slug).map(field => <Link key={field.slug} className={styles.link} href={`/roadmaps/${field.slug}`}>{field.name}</Link>)}</nav></section>
  </div></div>;
}
