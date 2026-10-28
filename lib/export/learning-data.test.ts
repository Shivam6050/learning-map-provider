import {describe,it,expect} from 'vitest';
import {learningExport,learningMarkdown,type ExportPathRow,type ExportStageRow} from './learning-data';
const path:ExportPathRow={id:'p',skill_level:'beginner',weekly_hours:5,budget_total:'5000',currency:'INR',created_at:'2026-10-01',fields:{name:'Backend development'}};
const stage:ExportStageRow={id:'s',path_id:'p',order_index:1,title:'HTTP and SQL',description:'Practice an API',estimated_hours:10};
const saved={stage_id:'s',status:'completed',completed_at:'2026-10-20',updated_at:'2026-10-20',practice_check:{user_submission:'My notes\nKeep Unicode: ₹',description:'Build this',topic_completion:{http:true,old:false},milestone_completion:{build:true},access_token:'PRIVATE_TOKEN',unexpected:{secret:'PRIVATE_SECRET'}}};
describe('learning export',()=>{
 it('preserves notes, currency and self-reported checks without serializing unrelated metadata',()=>{
  const result=learningExport([path],[stage],[saved],[],'2026-10-26T00:00:00Z');const item=result.roadmaps[0].stages[0];
  expect(item.notes).toBe(saved.practice_check.user_submission);expect(item.status).toBe('completed');expect(item.topics.find(t=>t.id==='http')?.completed).toBe(true);expect(item.topics.find(t=>t.id==='old')?.completed).toBe(false);expect(item.project_milestones.find(t=>t.id==='build')?.completed).toBe(true);expect(result.roadmaps[0].currency).toBe('INR');expect(JSON.stringify(result)).not.toContain('PRIVATE_');
 });
 it('sorts stages, supplies empty progress and excludes unrelated stage rows',()=>{
  const result=learningExport([path],[{...stage,id:'later',order_index:2},stage,{...stage,id:'foreign',path_id:'other'}],[],[]);
  expect(result.roadmaps[0].stages.map(s=>s.id)).toEqual(['s','later']);expect(result.roadmaps[0].stages[0].notes).toBeNull();expect(result.roadmaps[0].stages[0].status).toBe('not_started');
 });
 it('keeps unavailable curriculum progress instead of guessing a new curriculum',()=>{
  const result=learningExport([path],[stage],[{...saved,practice_check:{curriculum_ref:{id:'retired',version:99},topic_completion:{retired:true}}}],[]);
  expect(result.roadmaps[0].stages[0].topics).toEqual([{id:'retired',title:'retired',criterion:'Saved check from an earlier curriculum version.',completed:true}]);
 });
 it('handles missing joins and omits unsafe course URLs',()=>{
  const result=learningExport([{...path,fields:[]}],[stage],[],[{stage_id:'s',order_index:0,is_primary:true,resources:{id:'r',title:'Unsafe',platform:null,resource_type:'course',url:'javascript:alert(1)'}},{stage_id:'s',order_index:1,is_primary:false,resources:null}]);
  expect(result.roadmaps[0].title).toBe('Learning path');expect(result.roadmaps[0].stages[0].resources).toHaveLength(1);expect(result.roadmaps[0].stages[0].resources[0].url).toBeNull();
 });
 it('escapes HTML and Markdown injection while keeping multiline notes readable',()=>{
  const result=learningMarkdown(learningExport([path],[stage],[{...saved,practice_check:{user_submission:'<script>alert(1)</script>\n![x](javascript:alert(1))\n```\n# fake'}}],[]));
  expect(result).not.toContain('<script>');expect(result).not.toContain('![x](');expect(result).toContain('&lt;script&gt;');expect(result).toContain('> \\# fake');
 });
 it('renders an honest empty export',()=>expect(learningMarkdown(learningExport([],[],[],[]))).toContain('No saved roadmaps yet'));
});
