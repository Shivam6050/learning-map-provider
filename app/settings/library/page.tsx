import Link from 'next/link';
import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {getLearningUser} from '@/lib/auth/learning-user';
import {loadLearningAccess} from '@/lib/db/learning-access';
import {accessStatus} from '@/lib/learning-access';
import {LibraryAccessForm} from '@/components/LibraryAccessForm';
import {isSafeHttpUrl} from '@/lib/link-check/url-safety';
import {providerName} from '@/lib/web-discovery/providers';
import styles from './library.module.css';
export const metadata:Metadata={title:'Your course library | LearningMap',robots:{index:false,follow:false}};
export default async function LibraryPage({searchParams}:{searchParams:Promise<{q?:string;course?:string}>}){
 const params=await searchParams;const client=await createClient();const {data:{user}}=await getLearningUser(client,'/settings/library');
 if(!user)redirect('/login?next=%2Fsettings%2Flibrary');
 const query=(typeof params.q==='string'?params.q:'').trim().slice(0,60).replace(/[%_\\]/g,'');
 const courseId=typeof params.course==='string'&&/^[0-9a-f-]{36}$/i.test(params.course)?params.course:null;
 const {entries,available}=await loadLearningAccess(client,user.id);
 const ids=[...new Set(entries.flatMap(entry=>entry.resource_id?[entry.resource_id]:[]))];
 const courseRows=ids.length?await client.from('resources').select('id,title,url,platform').in('id',ids):{data:[],error:null};
 const courses=new Map((courseRows.data??[]).map(course=>[course.id,course]));
 let search=client.from('resources').select('id,title,url,platform').eq('resource_type','course').eq('trust_status','allowlisted').or('link_status.is.null,link_status.neq.broken').order('title').limit(12);
 if(courseId)search=search.eq('id',courseId);else if(query.length>=2)search=search.ilike('title','%'+query+'%');
 const result=courseId||query.length>=2?await search:{data:[],error:null};
 const offered=(result.data??[]).filter(course=>isSafeHttpUrl(course.url));
 const active=entries.filter(entry=>accessStatus(entry)==='active').length;
 return <div className={styles.page}>
  <div className={styles.layout}>
   <aside className={styles.sidebar}><Link href="/settings">← Account settings</Link><p className={styles.eyebrow}>YOUR LEARNING SHELF</p><h1>Keep what<br/><em>you’ve earned.</em></h1><p>Bring the courses and subscriptions you already have into every roadmap.</p><div className={styles.summary}><strong>{active}</strong><span>active access {active===1?'entry':'entries'}</span></div><Link href="/dashboard">Return to your roadmaps →</Link></aside>
   <div className={styles.content}>
    <header><p className={styles.eyebrow}>COURSES & SUBSCRIPTIONS</p><h2>One library. Every learning path.</h2><p>Access is self-reported. LearningMap does not check receipts, charge you or renew subscriptions.</p></header>
    {!available&&<p className={styles.error} role="alert">Your library is temporarily unavailable. Roadmaps will keep their existing course confirmations and will not assume new library access.</p>}
    <section className={styles.card} aria-labelledby="library-add"><h2 id="library-add">Add a course you already own</h2><p>Find an existing catalog course, or use the library link beside a course on your roadmap.</p><form method="get" className={styles.search}><label htmlFor="library-search">Search the course catalog</label><div><input id="library-search" name="q" type="search" minLength={2} maxLength={60} defaultValue={query} placeholder="Try React, Python or SQL"/><button>Find courses</button></div></form>
     {result.error&&<p role="alert" className={styles.error}>The catalog could not be searched. Please retry.</p>}
     {(courseId||query.length>=2)&&!result.error&&offered.length===0&&<p className={styles.hint}>No matching available courses. Try another topic.</p>}
     {offered.map(course=><article className={styles.result} key={course.id}><p className={styles.eyebrow}>{providerName(course.url)}</p><h3>{course.title}</h3>{entries.some(entry=>entry.resource_id===course.id)?<Link href={'#entry-'+entries.find(entry=>entry.resource_id===course.id)!.id}>Already saved — manage access below ↓</Link>:<LibraryAccessForm courseId={course.id}/>}</article>)}
    </section>
    {!entries.some(entry=>entry.subscription_key==='scrimba-pro')&&<section className={styles.card} aria-labelledby="library-pro"><p className={styles.eyebrow}>SHARED SUBSCRIPTION ACCESS</p><h2 id="library-pro">Already have Scrimba Pro?</h2><p>Save its paid-through date to cover the reviewed Pro modules used in your roadmaps. One entry covers eligible modules across your paths.</p><LibraryAccessForm subscription/></section>}
    <section aria-labelledby="library-entries"><div className={styles.listHeader}><h2 id="library-entries">Your saved access</h2><span>{entries.length} / 200</span></div>{available&&entries.length===0&&<div className={styles.empty}><h3>A shelf ready for your next chapter.</h3><p>Add an owned course or Scrimba Pro above. We’ll use it wherever the same course appears, without changing your learning progress.</p></div>}
     {courseRows.error&&<p role="alert" className={styles.error}>Some course titles could not be loaded. Your saved access is preserved.</p>}
     {entries.map(entry=>{const course=entry.resource_id?courses.get(entry.resource_id):null;const status=accessStatus(entry);return <article className={styles.card} id={'entry-'+entry.id} key={entry.id}><div className={styles.entryHeading}><div><p className={styles.eyebrow}>{entry.access_type==='subscription'?'SCRIMBA · SUBSCRIPTION':course?providerName(course.url):'COURSE ACCESS'}</p><h3>{entry.access_type==='subscription'?'Scrimba Pro':course?.title??'Saved course'}</h3></div><span className={styles.badge} data-status={status}>{status}</span></div><p className={styles.hint}>Self-reported · {entry.expires_on?'Valid through '+entry.expires_on+' (UTC)':'No expiry recorded'}. {status==='active'?'Counted only when it covers the planned stage dates.':'Not counted toward new roadmap estimates.'}</p><LibraryAccessForm entry={entry}/></article>;})}
    </section>
    <p className={styles.disclosure}>Pausing or expiring access changes future cost estimates. It never removes courses, resets completed work, edits notes or changes events already in your calendar. Existing confirmations made for an individual roadmap remain separate.</p>
   </div>
  </div>
 </div>;
}
