"use client";
import Link from "next/link";
import { useState, useMemo } from "react";
import { DeletePathButton } from "./DeletePathButton";
import type { DashboardPath } from "./DashboardWorkspace";
import styles from "./DashboardWorkspace.module.css";
function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} />
  </svg>;
}

export function DashboardPathList({paths,loadError}:{paths:DashboardPath[];loadError:boolean}) {
 const [filter,setFilter]=useState("all");
 const [query,setQuery]=useState("");
 const finished=(path:DashboardPath)=>path.stages.length>0&&path.stages.every(stage=>stage.status==="completed");
 const finishedCount=paths.filter(finished).length;
 const visiblePaths=useMemo(()=>paths.filter(path=>(filter==="all"||(filter==="completed"?finished(path):!finished(path)))&&path.name.toLowerCase().includes(query.trim().toLowerCase())),[paths,filter,query]);
 return (        <section id="learning-paths" className={styles.pathsSection}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>THE WORK IN PROGRESS</span><h2>My learning paths <span>{paths.length.toString().padStart(2, "0")}</span></h2></div>{paths.length > 0 && <label className={styles.search}><span aria-hidden="true">⌕</span><input id="dashboard-path-search" name="pathSearch" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a path" aria-label="Search your learning paths"/></label>}</div>
          {paths.length > 0 ? <><div className={styles.filters} role="group" aria-label="Filter learning paths">{[["all", "All paths", paths.length], ["active", "Active", paths.length - finishedCount], ["completed", "Completed", finishedCount]].map(([value, label, count]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(String(value))}>{label}<span>{count}</span></button>)}</div>
            <div className={styles.pathList}>{visiblePaths.map((path, index) => {
              const done = path.stages.filter(stage => stage.status === "completed").length;
              const next = path.stages.find(stage => stage.status === "in_progress") ?? path.stages.find(stage => stage.status !== "completed");
              const percent = path.stages.length ? Math.round(done / path.stages.length * 100) : 0;
              return <article key={path.id} className={styles.pathRow}><span className={styles.pathIndex}>{String(index + 1).padStart(2, "0")}</span><div className={styles.pathDetails}><span className={styles.pathLevel}>{path.level === "advanced" ? "Expert / Advanced" : path.level}</span><h3><Link href={`/paths/${path.id}`}>{path.name}</Link></h3><p>{next ? `Up next: ${next.title}` : path.stages.length ? "Every milestone completed. Well done." : "No milestones available yet."}</p></div><div className={styles.pathProgress}><span>{done} / {path.stages.length} milestones <b>{percent}%</b></span><progress value={done} max={path.stages.length || 1} aria-label={`${path.name} completion`}/></div><div className={styles.pathActions}><Link href={`/paths/${path.id}${next ? `#stage-${next.id}` : ""}`} aria-label={`Open ${path.name}`}><Arrow/></Link><DeletePathButton pathId={path.id} pathName={path.name}/></div></article>;
            })}{visiblePaths.length === 0 && <p className={styles.noResults}>No paths match this view. <button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Clear filters</button></p>}</div>
          </> : <div className={styles.emptyPath}><span className={styles.emptySymbol} aria-hidden="true">⌁</span><div><h3>{loadError ? "Your paths are temporarily unavailable" : "Your journey is still unwritten."}</h3><p>{loadError ? "Please retry before creating a new path." : "Start with one field below. Your personal roadmap will appear here."}</p></div><a href={loadError ? "/dashboard" : "#explore-fields"}>{loadError ? "Try again" : "Find my direction"}<Arrow/></a></div>}
        </section>);
}
