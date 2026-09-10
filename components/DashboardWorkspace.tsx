"use client";

import Link from "next/link";
import { useState } from "react";
import { DeletePathButton } from "@/components/DeletePathButton";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import styles from "./DashboardWorkspace.module.css";

export type DashboardPath = {
  id: string;
  name: string;
  level: string;
  stages: { id: string; title: string; hours: number; status: string }[];
};

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} />
  </svg>;
}

function FieldIcon({ index }: { index: number }) {
  const shapes = [
    <g key="server"><rect x="4" y="4" width="24" height="9" rx="2"/><rect x="4" y="19" width="24" height="9" rx="2"/><path d="M9 8.5h.1M9 23.5h.1M20 8.5h4M20 23.5h4"/></g>,
    <g key="window"><rect x="3" y="5" width="26" height="22" rx="2"/><path d="M3 12h26M9 5v7M11 18l-3 3 3 3m10-6 3 3-3 3"/></g>,
    <g key="layers"><path d="m16 3 13 8-13 8L3 11 16 3Zm-12 15 12 8 12-8M4 24l12 7 12-7"/></g>,
    <g key="network"><circle cx="16" cy="16" r="5"/><circle cx="5" cy="5" r="2"/><circle cx="27" cy="6" r="2"/><circle cx="5" cy="27" r="2"/><circle cx="27" cy="27" r="2"/><path d="m7 7 5 5m8 0 5-4M7 25l5-5m8 0 5 5"/></g>,
    <g key="chart"><path d="M4 4v24h25M10 22v-7m7 7V6m7 16V11"/></g>,
    <g key="cloud"><path d="M9 23H8a6 6 0 0 1-1-12 9 9 0 0 1 17-1 6.5 6.5 0 0 1 1 13h-2M16 16v13m-5-8 5-5 5 5"/></g>,
  ];
  return <svg width="30" height="30" viewBox="0 0 32 34" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[index % shapes.length]}</svg>;
}

function JourneyIllustration() {
  return <div className={styles.illustration} aria-label="Three steps: choose your field, find your level, set your pace">
    <div className={styles.mapLabel}>YOUR PERSONAL LEARNING MAP <span>01 — 03</span></div>
    <svg className={styles.mapLines} viewBox="0 0 400 240" fill="none" aria-hidden="true">
      <path d="M30 205C30 90 290 240 290 112S370 38 375 30" stroke="#aab79c" strokeWidth="1" strokeDasharray="4 6"/>
      <path d="M30 205C30 90 290 240 290 112S370 38 375 30" stroke="#9baa8a" strokeWidth="35" opacity=".07"/>
      <circle cx="360" cy="48" r="34" stroke="#b9c5ac"/><circle cx="360" cy="48" r="23" stroke="#b9c5ac"/>
      <path d="M351 48h18m-9-9v18" stroke="#7d906e"/>
    </svg>
    <div className={`${styles.mapStep} ${styles.mapStepOne}`}><b>01</b><div><small>A DIRECTION</small><strong>What inspires you?</strong></div></div>
    <div className={`${styles.mapStep} ${styles.mapStepTwo}`}><b>02</b><div><small>A STARTING POINT</small><strong>Meet yourself where you are.</strong></div></div>
    <div className={`${styles.mapStep} ${styles.mapStepThree}`}><b>03</b><div><small>A PLAN THAT FITS</small><strong>Your time. Your budget.</strong></div></div>
    <span className={styles.mapCaption}>A small first step. A whole new direction.</span>
  </div>;
}

export function DashboardWorkspace({ name, paths, loadError }: { name: string; paths: DashboardPath[]; loadError: boolean }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const allStages = paths.flatMap(path => path.stages.map((stage, index) => ({ ...stage, path, index })));
  const completed = allStages.filter(stage => stage.status === "completed").length;
  const inProgress = allStages.filter(stage => stage.status === "in_progress").length;
  // Prefer work already in progress, even when a newer path has unstarted stages.
  const resume = allStages.find(stage => stage.status === "in_progress") ?? allStages.find(stage => stage.status !== "completed");
  const finished = (path: DashboardPath) => path.stages.length > 0 && path.stages.every(stage => stage.status === "completed");
  const finishedCount = paths.filter(finished).length;
  const visiblePaths = paths.filter(path => (filter === "all" || (filter === "completed" ? finished(path) : !finished(path))) && path.name.toLowerCase().includes(query.trim().toLowerCase()));

  return <div className={styles.workspace}>
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Learning workspace">
        <div className={styles.workspaceMark}><span aria-hidden="true">L<span>↗</span></span><div>YOUR WORKSPACE<small>Make progress, your way.</small></div></div>
        <nav className={styles.sideNav} aria-label="Dashboard sections">
          <a href="#overview" className={styles.selected}><span aria-hidden="true">◫</span> Overview <span className={styles.currentDot}/></a>
          <a href="#learning-paths"><span aria-hidden="true">⌁</span> My learning paths <small>{paths.length}</small></a>
          <a href="#explore-fields"><span aria-hidden="true">↗</span> Explore fields</a>
        </nav>
        <div className={styles.sidebarNote}><span>THE LONG VIEW</span><p>Little by little,<br/><em>a little becomes a lot.</em></p><div className={styles.noteLine}/><small>One milestone at a time.</small></div>
        <Link href="/settings" className={styles.preferences}>Learning preferences <Arrow diagonal/></Link>
      </aside>

      <div className={styles.content} id="overview">
        <header className={styles.pageHeader}><div><p className={styles.eyebrow}>YOUR LEARNING STUDIO</p><h1>{paths.length ? "Keep your momentum." : "A fresh page. A new possibility."}</h1><p>Welcome back, <strong>{name}</strong>. {paths.length ? "Let’s turn a little focus into your next milestone." : "Your next chapter starts with a little direction."}</p></div><Link href="/onboarding" className={styles.headerAction}>New learning path <span aria-hidden="true">＋</span></Link></header>

        {loadError && <div className={styles.error} role="alert">We couldn’t load your paths. Your saved work is still there. <a href="/dashboard">Try again</a></div>}

        <section className={styles.topGrid} aria-label="Learning overview">
          {resume ? <div className={styles.focusCard}>
            <p className={styles.eyebrow}>YOUR NEXT CHAPTER <span>{resume.status === "in_progress" ? "In progress" : "Ready to start"}</span></p>
            <span className={styles.focusField}>{resume.path.name}</span>
            <h2>{resume.title}</h2><p>Milestone {resume.index + 1} of {resume.path.stages.length} <span>·</span> {resume.hours} hours estimated</p>
            <div className={styles.focusFooter}><Link href={`/paths/${resume.path.id}#stage-${resume.id}`} className={styles.primary}>{resume.status === "in_progress" ? "Continue learning" : "Start this milestone"}<Arrow/></Link><span>One step closer.</span></div>
            <div className={styles.stageTrack} aria-label={`${resume.path.stages.filter(stage => stage.status === "completed").length} of ${resume.path.stages.length} milestones completed`}>{resume.path.stages.map(stage => <span key={stage.id} data-complete={stage.status === "completed"} data-current={stage.id === resume.id}/>)}</div>
          </div> : <div className={styles.startCard}>
            <div className={styles.startCopy}><p className={styles.eyebrow}>{paths.length ? "ROOM FOR WHAT’S NEXT" : "YOUR FIRST CHAPTER"}</p><h2>{paths.length ? <>A finish line.<br/><em>A new beginning.</em></> : <>Big ambitions.<br/><em>Small first steps.</em></>}</h2><p>{paths.length ? "You’ve completed your milestones. Choose a new field or go deeper into the skills you love." : "Choose what you want to learn. We’ll help you find the right starting point and a path that fits your life."}</p><Link href="/onboarding" className={styles.primary}>{paths.length ? "Explore my next path" : "Build my first path"}<Arrow/></Link><small>No perfect plan needed. Just a little curiosity.</small></div>
            <JourneyIllustration/>
          </div>}

          <aside className={styles.notebook} data-active={paths.length > 0}><div className={styles.notebookHeading}><h2>Your learning, at a glance</h2><span aria-hidden="true">↗</span></div>
            {paths.length ? <><div className={styles.progressNumber}>{completed}<span> / {allStages.length}</span><small>MILESTONES COMPLETED</small></div><progress aria-label="Overall milestone completion" max={allStages.length || 1} value={completed}/><dl><div><dt>Learning paths</dt><dd>{paths.length}</dd></div><div><dt>In-progress milestones</dt><dd>{inProgress}</dd></div><div><dt>Finished paths</dt><dd>{finishedCount}</dd></div></dl><p>Progress is built through practice. Keep showing up.</p></> : <><div className={styles.notebookZero}><span aria-hidden="true">✳</span><h3>Let’s make this yours.</h3><p>Your milestones and progress will live here once you create a path.</p></div><div className={styles.notebookHint}><span>01</span><p>Choose a field that sparks your curiosity.</p></div><div className={styles.notebookHint}><span>02</span><p>Set a pace you can actually keep.</p></div></>}
          </aside>
        </section>

        <section id="learning-paths" className={styles.pathsSection}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>THE WORK IN PROGRESS</span><h2>My learning paths <span>{paths.length.toString().padStart(2, "0")}</span></h2></div>{paths.length > 0 && <label className={styles.search}><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a path" aria-label="Search your learning paths"/></label>}</div>
          {paths.length > 0 ? <><div className={styles.filters} aria-label="Filter learning paths">{[["all", "All paths", paths.length], ["active", "Active", paths.length - finishedCount], ["completed", "Completed", finishedCount]].map(([value, label, count]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(String(value))}>{label}<span>{count}</span></button>)}</div>
            <div className={styles.pathList}>{visiblePaths.map((path, index) => {
              const done = path.stages.filter(stage => stage.status === "completed").length;
              const next = path.stages.find(stage => stage.status === "in_progress") ?? path.stages.find(stage => stage.status !== "completed");
              const percent = path.stages.length ? Math.round(done / path.stages.length * 100) : 0;
              return <article key={path.id} className={styles.pathRow}><span className={styles.pathIndex}>{String(index + 1).padStart(2, "0")}</span><div className={styles.pathDetails}><span className={styles.pathLevel}>{path.level === "advanced" ? "Expert / Advanced" : path.level}</span><h3><Link href={`/paths/${path.id}`}>{path.name}</Link></h3><p>{next ? `Up next: ${next.title}` : path.stages.length ? "Every milestone completed. Well done." : "No milestones available yet."}</p></div><div className={styles.pathProgress}><span>{done} / {path.stages.length} milestones <b>{percent}%</b></span><progress value={done} max={path.stages.length || 1} aria-label={`${path.name} completion`}/></div><div className={styles.pathActions}><Link href={`/paths/${path.id}${next ? `#stage-${next.id}` : ""}`} aria-label={`Open ${path.name}`}><Arrow/></Link><DeletePathButton pathId={path.id} pathName={path.name}/></div></article>;
            })}{visiblePaths.length === 0 && <p className={styles.noResults}>No paths match this view. <button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Clear filters</button></p>}</div>
          </> : <div className={styles.emptyPath}><span className={styles.emptySymbol} aria-hidden="true">⌁</span><div><h3>{loadError ? "Your paths are temporarily unavailable" : "Your journey is still unwritten."}</h3><p>{loadError ? "Please retry before creating a new path." : "Start with one field below. Your personal roadmap will appear here."}</p></div><a href={loadError ? "/dashboard" : "#explore-fields"}>{loadError ? "Try again" : "Find my direction"}<Arrow/></a></div>}
        </section>

        <section id="explore-fields" className={styles.exploreSection}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>FOLLOW YOUR CURIOSITY</span><h2>Where do you want to go?</h2></div><span className={styles.sectionAside}>Six fields. Plenty of possibilities.</span></div>
          <div className={styles.fields}>{FIELD_CATALOG.map((field, index) => <Link key={field.slug} href={`/onboarding?field=${field.slug}`} className={styles.fieldCard}><div className={styles.fieldTop}><FieldIcon index={index}/><Arrow diagonal/></div><h3>{field.name}</h3><p>{["APIs, systems & the logic behind it all", "Interfaces that people love to use", "Bring the whole experience together", "Build with data and intelligence", "Turn questions into clear insights", "Ship, scale & keep things running"][index]}</p><span>Explore this field <Arrow/></span></Link>)}</div>
        </section>
        <div className={styles.bottomNote}><span aria-hidden="true">↳</span><p>A path built around <strong>your level, your time, your budget.</strong> Free resources are always an option.</p><Link href="/onboarding">Make it personal <Arrow diagonal/></Link></div>
      </div>
    </div>
  </div>;
}
