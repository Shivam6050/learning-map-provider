"use client";
import styles from "@/app/onboarding/onboarding.module.css";
import { useState } from "react";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { assessStartingLevel } from "@/app/onboarding/assessment";
import { useTransition } from "react";

export function FieldAndQuizPicker({ initialField, quizzes }: { initialField?: string; quizzes: Record<string,{id:string;prompt:string;options:string[]}[]> }) {
  const [fieldSlug, setFieldSlug] = useState(FIELD_CATALOG.some(f => f.slug === initialField) ? initialField! : FIELD_CATALOG[0].slug);
  const [skipQuiz, setSkipQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Awaited<ReturnType<typeof assessStartingLevel>> | null>(null);
  const [pending,startTransition]=useTransition();
  const [error,setError]=useState("");
  const quiz = quizzes[fieldSlug] ?? [];
  const count = quiz.filter(q => answers[q.id] !== undefined).length;

  return <div className="space-y-6">
    <div><label htmlFor="fieldSlug" className="block text-sm font-semibold text-white">01 / Your direction</label><select id="fieldSlug" name="fieldSlug" disabled={pending} value={fieldSlug} onChange={e => { setFieldSlug(e.target.value); setAnswers({}); setResult(null); }} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white">{FIELD_CATALOG.map(f=><option key={f.slug} value={f.slug}>{f.name}</option>)}</select></div>
    <div className="assessment-choice"><div><h3>Find your starting point</h3><p>A short knowledge check, tailored to your field.</p></div><button type="button" disabled={pending} aria-pressed={skipQuiz} onClick={()=>{setSkipQuiz(!skipQuiz);setAnswers({});setResult(null);}}>{skipQuiz ? "Take assessment" : "I know my level"}</button></div>
    {skipQuiz ? <p className="self-level-hint">Choose your experience level below. You can take the assessment any time you build a new path.</p> : <div className="assessment-panel">
      <div className="assessment-progress"><span>{count} of {quiz.length} answered</span><progress max={quiz.length} value={count} aria-label="Assessment progress" /></div>
      {quiz.map((q,i)=><fieldset disabled={pending} key={q.id} className="assessment-question"><legend><span>0{i+1}</span> {q.prompt}</legend><div className={styles.answers}>{q.options.map((option,index)=><label key={index}><input required type="radio" name={'quiz_'+q.id} value={index} checked={answers[q.id]===index} onChange={()=>{setAnswers({...answers,[q.id]:index});setResult(null);}}/><span>{option}</span></label>)}</div></fieldset>)}
      <button type="button" className="atlas-button" disabled={pending || count !== quiz.length} onClick={()=>startTransition(async()=>{setError("");try{setResult(await assessStartingLevel(fieldSlug,quiz.map(q=>answers[q.id])));}catch{setError("Could not check your answers. Please try again.");}})}>See my starting level ↗</button>
      {error && <p role="alert">{error}</p>}
      {result && <div className="assessment-result" role="status"><small>YOUR STARTING-POINT ESTIMATE</small><h3>{result.quizScore}/{quiz.length} · {result.finalLevel === "advanced" ? "Expert / Advanced" : result.finalLevel}</h3><p>Your path will use this level. This short quiz checks familiarity; practical milestones help you validate your skills as you learn.</p></div>}
    </div>}
  </div>;
}
