"use client";
import {useEffect,useRef,useState,useTransition} from 'react';
import {loadStageKnowledge,submitStageKnowledge} from '@/app/paths/[id]/knowledge';
import type {KnowledgeQuiz,KnowledgeResult} from '@/lib/paths/knowledge-types';
import styles from './StageKnowledgeCheck.module.css';
export function StageKnowledgeCheck({pathId,stageId}:{pathId:string;stageId:string}){
 const [quiz,setQuiz]=useState<KnowledgeQuiz|null>(null),[answers,setAnswers]=useState<Record<string,number>>({}),[result,setResult]=useState<KnowledgeResult|null>(null),[error,setError]=useState('');
 const [pending,startTransition]=useTransition();const lock=useRef(false),feedback=useRef<HTMLDivElement>(null),questionArea=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(result)feedback.current?.focus();else if(quiz)questionArea.current?.focus();},[quiz,result]);
 function start(){if(lock.current)return;lock.current=true;setError('');startTransition(async()=>{try{const response=await loadStageKnowledge(pathId,stageId);if(response.ok&&response.quiz){setQuiz(response.quiz);setAnswers({});setResult(null);}else setError(response.message);}catch{setError('Could not load the questions. Please retry.');}finally{lock.current=false;}});}
 function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(lock.current||!quiz)return;lock.current=true;setError('');startTransition(async()=>{try{const response=await submitStageKnowledge(pathId,stageId,quiz.version,quiz.questions.map(question=>({id:question.id,choice:answers[question.id]})));if(response.ok&&response.result){setResult(response.result);}else setError(response.message);}catch{setError('Could not check your answers. Your choices are still here; please retry.');}finally{lock.current=false;}});}
 return <details className={styles.panel}>
  <summary><span><strong>Check your understanding</strong><small>Optional · short concept check</small></span><span aria-hidden="true">⌄</span></summary>
  <div className={styles.body}><p className={styles.intro}>Test a few concepts from this stage, then learn from the explanations. This is practice, not a certificate or a complete assessment of your level.</p>
   {!quiz&&<button type="button" disabled={pending} onClick={start}>{pending?'Loading questions…':'Start knowledge check'}</button>}
   {quiz&&<div ref={questionArea} tabIndex={-1} className={styles.questions}>
    <p className={styles.meta}>{quiz.questions.length} {quiz.questions.length===1?'question':'questions'} · Choose one answer each</p>
    <form onSubmit={submit}>
     {quiz.questions.map((question,index)=><fieldset key={question.id} disabled={pending||Boolean(result)}><legend><span>{String(index+1).padStart(2,'0')} / {question.topic}</span>{question.prompt}</legend>{question.options.map((option,choice)=><label key={choice} className={styles.option}><input type="radio" name={'knowledge-'+stageId+'-'+question.id} value={choice} checked={answers[question.id]===choice} onChange={()=>setAnswers(previous=>({...previous,[question.id]:choice}))} required/><span>{option}</span></label>)}</fieldset>)}
     {!result&&<div className={styles.actions}><button type="submit" disabled={pending||quiz.questions.some(question=>answers[question.id]===undefined)}>{pending?'Checking answers…':'Check my answers'}</button><button type="button" disabled={pending} className={styles.secondary} onClick={start}>Reload check</button></div>}
    </form>
   </div>}
   {result&&<div ref={feedback} tabIndex={-1} className={styles.results} aria-label="Knowledge check results"><h4>{result.correct} of {result.total} correct on this attempt</h4><p>{result.correct===result.total?'Good work on these concepts. Apply them in your project next.':'Review the explanations, revisit the stage resources, then try again.'}</p>{result.feedback.map((item,index)=><div key={item.id} className={styles.explanation} data-correct={item.correct}><strong>{index+1}. {item.topic} · {item.correct?'Correct':'Review this concept'}</strong>{!item.correct&&<p>Your answer: {item.selected}</p>}<p>Answer: {item.answer}</p><p>{item.explanation}</p></div>)}<button type="button" disabled={pending} onClick={start}>{pending?'Loading…':'Try these concepts again'}</button></div>}
   {error&&<p role="alert" className={styles.error}>{error}</p>}
   <p className={styles.note}>Results are not saved; leaving this stage or refreshing may clear them. Retrying uses the same question bank. This does not change your stage status, topic checks, notes or project milestones.</p>
   <span role="status" aria-live="polite" className={styles.srOnly}>{pending?'Working…':result?`${result.correct} of ${result.total} correct.`:''}</span>
  </div>
 </details>;
}
