import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLearningUser } from "@/lib/auth/learning-user";
import { REPORT_REASONS,type ReportReason } from "@/lib/paths/resource-management";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";
import { ResourceReportReview } from "@/components/ResourceReportReview";
import styles from "./reports.module.css";
export const metadata={title:"Resource reports | LearningMap",robots:{index:false,follow:false}};
export default async function ResourceReportsPage({searchParams}:{searchParams:Promise<{status?:string;page?:string}>}) {
 const client=await createClient();const {data:{user}}=await getLearningUser(client,"/admin/resource-reports");
 if(!user)redirect("/login?next=%2Fadmin%2Fresource-reports");
 const {data:profile}=await client.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin")notFound();
 const query=await searchParams;
 const status=["open","reviewing","resolved","dismissed"].includes(query.status??"")?query.status!:"open";
 const page=/^\d{1,3}$/.test(query.page??"")?Math.max(1,Number(query.page)):1;
 const {data:reports,error}=await client.from("resource_reports").select("id,reason,details,status,resolution,created_at,reviewed_at,resources(title,url)").eq("status",status).order("created_at",{ascending:false}).order("id").range((page-1)*25,page*25);
 const visible=(reports??[]).slice(0,25);
 return <div className={styles.page}>
  <Link href="/admin/trusted-sources" className={styles.back}>← Source administration</Link>
  <header><p>LEARNING QUALITY</p><h1>Resource review desk</h1><span>Review learner reports with context. A report never automatically changes a shared course price or removes a resource.</span></header>
  <nav aria-label="Filter resource reports">{["open","reviewing","resolved","dismissed"].map(value=><Link key={value} href={"?status="+value} aria-current={status===value?"page":undefined}>{value}</Link>)}</nav>
  {error?<p role="alert">Reports could not be loaded. Confirm the resource-management migration is applied, then try again.</p>:visible.length?<ul className={styles.list}>{visible.map(report=>{
   const resource=Array.isArray(report.resources)?report.resources[0]:report.resources;
   return <li key={report.id}><p className={styles.reason}>{REPORT_REASONS[report.reason as ReportReason]??"Resource problem"} · {new Date(report.created_at).toISOString().slice(0,10)}</p><h2>{resource?.title??"Resource"}</h2>{resource?.url&&isSafeHttpUrl(resource.url)&&<a href={resource.url} target="_blank" rel="noopener noreferrer">Open provider page ↗</a>}<p className={styles.details}>{report.details||"No additional details provided."}</p><ResourceReportReview id={report.id} status={report.status} resolution={report.resolution} reviewedAt={report.reviewed_at}/></li>;
  })}</ul>:<p className={styles.empty}>No reports in this view.</p>}
  <div className={styles.pagination}>{page>1&&<Link href={`?status=${status}&page=${page-1}`}>← Newer reports</Link>}{(reports?.length??0)>25&&<Link href={`?status=${status}&page=${page+1}`}>Older reports →</Link>}</div>
 </div>;
}
