import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {BANK_VERSION,questionBank,stageQuestions,publicQuiz,gradeKnowledge} from './stage-knowledge-bank';
import {curriculumUnits,topicDefinitions} from '@/lib/paths/authored-curriculum';
describe('authored question bank',()=>{
 it('covers every authored curriculum topic with a unique, valid key and explanation',()=>{
  expect(new Set(questionBank.map(q=>q.id)).size).toBe(questionBank.length);
  for(const topic of Object.keys(topicDefinitions))expect(questionBank.some(q=>q.topic===topic),topic).toBe(true);
  for(const question of questionBank){expect(question.options).toHaveLength(3);expect(new Set(question.options).size).toBe(3);expect(question.correct).toBeGreaterThanOrEqual(0);expect(question.correct).toBeLessThan(3);expect(question.explanation.length).toBeGreaterThan(40);expect(question.prompt.length).toBeGreaterThan(20);}
 });
 it('has a topic-mapped check for every current curriculum unit',()=>{
  for(const unit of curriculumUnits){const questions=stageQuestions(unit.title,null,{id:unit.id,version:unit.version});expect(questions.length,unit.title).toBeGreaterThan(0);expect(questions.length).toBeLessThanOrEqual(4);expect(questions.every(q=>unit.topicIds.some(id=>q.id===id+'.v1'))).toBe(true);}
 });
 it('does not replace an unavailable saved version with another quiz',()=>expect(stageQuestions('HTTP and SQL',null,{id:'removed',version:99})).toEqual([]));
 it('uses bounded topic checks for legacy stages',()=>{const questions=stageQuestions('HTTP SQL authentication tests deployment performance',null);expect(questions).toHaveLength(4);expect(new Set(questions.map(q=>q.id)).size).toBe(4);});
 it('does not send answer keys or explanations before submission',()=>{
  const quiz=publicQuiz(stageQuestions('HTTP and SQL',null));expect(quiz.version).toContain(BANK_VERSION);
  for(const question of quiz.questions){expect(Object.keys(question).sort()).toEqual(['id','options','prompt','topic']);}
 });
});
describe('server grading',()=>{
 const questions=stageQuestions('HTTP SQL authentication',null),version=publicQuiz(questions).version;
 const correct=()=>questions.map(q=>({id:q.id,choice:q.correct}));
 it('computes all-correct and all-incorrect results and explains each answer',()=>{
  const result=gradeKnowledge(questions,version,correct());expect(result.correct).toBe(questions.length);expect(result.feedback.every(q=>q.explanation&&q.answer)).toBe(true);
  expect(gradeKnowledge(questions,version,questions.map(q=>({id:q.id,choice:(q.correct+1)%3}))).correct).toBe(0);
 });
 it('uses IDs rather than trusting answer order or client scores',()=>{const answers=correct().reverse().map(a=>({...a,score:999,correct:false}));expect(gradeKnowledge(questions,version,answers).correct).toBe(questions.length);});
 it.each(['stale','missing','duplicate','foreign','negative','fractional','string','too-large','null'])('rejects %s submissions',kind=>{
  let answers:unknown=correct();let v=version;
  if(kind==='stale')v='old';if(kind==='missing')answers=correct().slice(1);if(kind==='duplicate')answers=correct().map(()=>correct()[0]);if(kind==='foreign')answers=correct().map((a,i)=>i? a:{...a,id:'other'});if(kind==='negative')answers=correct().map(a=>({...a,choice:-1}));if(kind==='fractional')answers=correct().map(a=>({...a,choice:.5}));if(kind==='string')answers=correct().map(a=>({...a,choice:'0'}));if(kind==='too-large')answers=correct().map(a=>({...a,choice:999}));if(kind==='null')answers=null;
  expect(()=>gradeKnowledge(questions,v,answers)).toThrow();
 });
 it('cannot grade an empty question set as a perfect result',()=>expect(()=>gradeKnowledge([],publicQuiz([]).version,[])).toThrow());
});
