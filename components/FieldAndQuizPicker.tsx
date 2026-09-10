"use client";
import { useState } from "react";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { getQuizForField, blendSkillLevel } from "@/lib/onboarding/skill-quiz";

export function FieldAndQuizPicker({ initialField }: { initialField?: string }) {
  const [fieldSlug, setFieldSlug] = useState(FIELD_CATALOG.some(f => f.slug === initialField) ? initialField! : FIELD_CATALOG[0].slug);
  const [skipQuiz, setSkipQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const quiz = getQuizForField(fieldSlug);
  const count = quiz.filter(q => answers[q.id] !== undefined).length;
  const result = showResult ? blendSkillLevel("beginner", quiz.map(q => answers[q.id]), fieldSlug) : null;
  return <div className="space-y-6">
    <div><label htmlFor="fieldSlug" className="block text-sm font-semibold text-white">01 / Your direction</label><select id="fieldSlug" name="fieldSlug" value={fieldSlug} onChange={e => { setFieldSlug(e.target.value); setAnswers({}); setShowResult(false); }} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white">{FIELD_CATALOG.map(f=><option key={f.slug} value={f.slug}>{f.name}</option>)}</select></div>
    <div className="assessment-choice"><div><h3>Find your starting point</h3><p>A short knowledge check, tailored to your field.</p></div><button type="button" aria-pressed={skipQuiz} onClick={()=>{setSkipQuiz(!skipQuiz);setAnswers({});setShowResult(false);}}>{skipQuiz ? "Take assessment" : "I know my level"}</button></div>
    {skipQuiz ? <p className="text-sm text-slate-300">Choose your experience level below. You can take the assessment any time you build a new path.</p> : <div className="assessment-panel">
      <div className="assessment-progress"><span>{count} of {quiz.length} answered</span><progress max={quiz.length} value={count} aria-label="Assessment progress" /></div>
      {quiz.map((q,i)=><fieldset key={q.id} className="assessment-question"><legend><span>0{i+1}</span> {q.prompt}</legend>{q.options.map((option,index)=><label key={index}><input required type="radio" name={'quiz_'+q.id} value={index} checked={answers[q.id]===index} onChange={()=>{setAnswers({...answers,[q.id]:index});setShowResult(false);}}/><span>{option}</span></label>)}</fieldset>)}
      <button type="button" className="atlas-button" disabled={count !== quiz.length} onClick={()=>setShowResult(true)}>See my starting level ↗</button>
      {result && <div className="assessment-result" role="status"><small>YOUR STARTING-POINT ESTIMATE</small><h3>{result.quizScore}/{quiz.length} · {result.finalLevel === "advanced" ? "Expert / Advanced" : result.finalLevel}</h3><p>Your path will use this level. This short quiz checks familiarity; practical milestones help you validate your skills as you learn.</p></div>}
    </div>}
  </div>;
}
