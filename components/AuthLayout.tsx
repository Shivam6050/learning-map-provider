import Link from "next/link";
import styles from "./AuthLayout.module.css";
export function AuthLayout({children,signup=false}:{children:React.ReactNode;signup?:boolean}) {
 return <div className={styles.page}><div className={styles.layout}>
 <aside className={styles.story} aria-label="Learning with a plan">
  <p className={styles.eyebrow}>A little direction. A lot of possibility.</p>
  <h2>Your next chapter <br/>starts with <em>a path.</em></h2>
  <p className={styles.intro}>Turn what you want to learn into a plan you can follow. Built around your experience, your time, and your budget.</p>
  <div className={styles.map} aria-hidden="true"><div className={styles.mapTop}><span>THE WAY FORWARD</span><span>YOUR PACE</span></div>
   <div className={styles.stop}><span>01</span><div><strong>Find your starting point</strong><small>Beginner, intermediate, or beyond.</small></div></div>
   <div className={styles.stop}><span>02</span><div><strong>Follow a thoughtful plan</strong><small>Relevant courses. Clear milestones.</small></div></div>
   <div className={styles.stop}><span>03</span><div><strong>Make it yours</strong><small>Learn, practise, and see your progress.</small></div></div>
   <div className={styles.mapBottom}>From a first step to a new skill.<svg width="48" height="16" viewBox="0 0 48 16" fill="none"><path d="M1 8h44m-7-6 7 6-7 6" stroke="currentColor"/></svg></div>
  </div><p className={styles.signature}>Less searching. More learning.</p>
 </aside>
 <section className={styles.panel}><div className={styles.switcher}>{signup ? "Already have an account?" : "New to LearningMap?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}<span aria-hidden="true"> ↗</span></Link></div><div className={styles.content}>{children}</div><p className={styles.footer}>A plan for your ambition. Room for your own pace.</p></section>
 </div></div>;
}
