import Link from "next/link";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { getPublicGuide } from "@/lib/fields/public-guides";
import { breadcrumbData, publicPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import styles from "./roadmaps.module.css";

export const metadata = publicPageMetadata("/roadmaps", "Learning Roadmaps for Developers & Data Skills | LearningMap",
  "Explore frontend, backend, full-stack, AI, data science and DevOps learning roadmaps. Find topics, practice projects and a path for your level and budget.");

export default function RoadmapsPage() {
  return <div className={styles.page}><div className={styles.container}>
    <JsonLd data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Learning roadmaps", path: "/roadmaps" }])} />
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Learning roadmaps</span></nav>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>A direction worth exploring</p>
      <h1>Learning roadmaps.<br />A clearer place to start.</h1>
      <p>Explore what to learn, in what order, and what to build along the way. These public guides show the curriculum behind LearningMap. Create your own roadmap to match courses and resources to your experience, weekly study hours and budget.</p>
      <div className={styles.actions}><Link className={styles.button} href="/onboarding">Build my learning path <span aria-hidden="true"> ↗</span></Link><a className={styles.link} href="#fields">Browse the six fields</a></div>
    </header>
    <section id="fields" className={styles.grid} aria-label="Roadmaps by learning field">
      {FIELD_CATALOG.map((field, index) => {
        const guide = getPublicGuide(field.slug)!;
        return <article className={styles.card} key={field.slug}>
          <span className={styles.number}>0{index + 1} / LEARNING GUIDE</span>
          <h2><Link href={`/roadmaps/${field.slug}`}>{field.name} roadmap</Link></h2>
          <p>{guide.summary}</p>
          <Link className={styles.link} href={`/roadmaps/${field.slug}`}>Explore the roadmap <span aria-hidden="true">↗</span></Link>
        </article>;
      })}
    </section>
    <section className={styles.section}>
      <h2>A learning roadmap or a mind map?</h2>
      <p>A mind map connects related ideas around a subject. A learning roadmap adds an order: prerequisites first, then new skills, practice and projects. LearningMap provides sequenced roadmaps so you can decide what to work on next; it does not provide a mind-map drawing editor.</p>
    </section>
    <section className={styles.section}>
      <h2>Choose courses around a goal, not a list.</h2>
      <p>For frontend, backend or full-stack courses, first check which skills a course covers and what you will build. A subscription may include several courses, while a certificate or individual course can be priced separately. Your personalized path compares available resources against your budget and keeps a free route available.</p>
      <p>Courses from providers such as Scrimba, GeeksforGeeks and W3Schools can appear when they fit the topic and are available. Paid recommendations depend on reliable pricing evidence. Offers, regional prices and final checkout terms can change.</p>
    </section>
  </div></div>;
}
