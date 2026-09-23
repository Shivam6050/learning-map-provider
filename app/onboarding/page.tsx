import Link from "next/link";
import { generatePath } from "@/app/onboarding/actions";
import { FieldAndQuizPicker } from "@/components/FieldAndQuizPicker";
import { CommitmentAndBudgetPicker } from "@/components/CommitmentAndBudgetPicker";
import { SubmitButton } from "@/components/SubmitButton";
import styles from "./onboarding.module.css";

export default async function OnboardingPage({ searchParams }: {
  searchParams: Promise<{ error?: string; field?: string }>;
}) {
  const params = await searchParams;
  return <div className={styles.page}>
    <div className={styles.layout}>
      <aside className={styles.intro}>
        <Link href="/dashboard" className={styles.back}>← Back to dashboard</Link>
        <p className={styles.eyebrow}>A little direction changes everything</p>
        <h1>Your next chapter.<br/><em>Mapped for you.</em></h1>
        <p className={styles.description}>Start with where you are. We’ll help you find what to learn next, at a pace and price that work for you.</p>
        <ol className={styles.steps}>
          <li><span>01</span><div><strong>Choose your direction</strong><p>A field you’re ready to explore.</p></div></li>
          <li><span>02</span><div><strong>Find your starting point</strong><p>Check your knowledge or choose your level.</p></div></li>
          <li><span>03</span><div><strong>Make it fit your life</strong><p>Your time, your budget, your path.</p></div></li>
        </ol>
        <div className={styles.note}><span>WHAT COMES NEXT</span><p>Compare a fuller route, a balanced option and a free path. Choose the one that feels right.</p><small>Paid options depend on course availability and your budget.</small></div>
      </aside>
      <section className={styles.panel} aria-labelledby="onboarding-title">
        <header className={styles.heading}><p className={styles.eyebrow}>YOUR LEARNING BRIEF</p><h2 id="onboarding-title">Let’s find your way forward.</h2><p>A few choices now. A clearer next step ahead.</p></header>
        {params.error && <div className={styles.error} role="alert">{params.error}</div>}
        <form action={generatePath} className={styles.form}>
          <FieldAndQuizPicker initialField={params.field}/>
          <CommitmentAndBudgetPicker/>
          <footer className={styles.submit}><SubmitButton/><p>We’ll check available resources and prepare your options. Keep this page open while we build your roadmap.</p></footer>
        </form>
      </section>
    </div>
  </div>;
}
