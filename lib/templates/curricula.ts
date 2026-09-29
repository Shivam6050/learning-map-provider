import type {SkeletonStage} from "@/lib/ai/skeleton";
type Unit=[string,string,string[],number];
const units:Record<string,{intermediate:Unit[];advanced:Unit[]}>= {
 "backend-development": {
  intermediate:[
   ["Build a validated service","Implement a booking API with validation, pagination and consistent errors. Test invalid requests and duplicate submissions.",["node.js","express","rest api"],20],
   ["Model reliable data writes","Add PostgreSQL transactions and constraints. Prove two concurrent bookings cannot claim the same seat.",["postgresql","sql"],24],
   ["Enforce ownership and sessions","Add sessions and per-user authorization. Write tests proving one user cannot read or change another user's booking.",["web security","express"],22],
   ["Ship and observe the service","Deploy with health checks and structured logs. Reproduce a failed dependency and document recovery steps.",["docker","node.js"],18]],
  advanced:[
   ["Design consistency boundaries","Design an order workflow with an outbox and idempotent consumers. Demonstrate recovery after duplicate delivery and partial failure.",["postgresql","system design"],30],
   ["Investigate database contention","Profile concurrent transactions and slow queries. Compare query plans, indexes and locking before and after a measured change.",["postgresql","sql"],28],
   ["Bound overload and dependency failures","Implement bounded queues, deadlines and backpressure. Load-test a degraded dependency and report latency percentiles and failure rates.",["node.js","system design"],30],
   ["Threat-model and operate a service","Review tenant isolation and secret handling, run a recovery drill, and write a production readiness review with evidence and remaining risks.",["web security","docker"],28]]},
 "frontend-development":{
  intermediate:[
   ["Build accessible interaction patterns","Build a searchable combobox and modal. Verify keyboard navigation, focus restoration and screen-reader labels.",["html css","javascript"],20],
   ["Manage asynchronous interface state","Build a React search interface handling stale responses, cancellation, errors and retry. Test rapid changes and slow networks.",["react","javascript"],24],
   ["Create a reusable component system","Implement consistent forms, feedback and responsive layouts. Document variants and check contrast across states.",["css","react"],20],
   ["Measure and ship a complete interface","Test the main journey at mobile widths and under throttling. Record performance measurements and fix the largest verified bottleneck.",["react testing","web performance"],22]],
  advanced:[
   ["Design rendering and data boundaries","Compare server and client rendering for a data-heavy application. Document caching, invalidation and privacy tradeoffs.",["nextjs","react"],26],
   ["Profile interaction performance","Profile a large interactive list. Improve input latency and memory usage without breaking keyboard access, and publish before/after measurements.",["javascript","react"],28],
   ["Engineer resilient interface contracts","Design typed data contracts and recovery states for versioned APIs. Test malformed responses, race conditions and optimistic rollback.",["typescript","react"],26],
   ["Audit and evolve a design system","Audit accessibility across a component library and propose a backwards-compatible migration. Demonstrate tests and rollout checks.",["html css","react testing"],28]]},
 "full-stack-development":{
  intermediate:[
   ["Deliver a complete user journey","Build a task application from a validated form to an API and database. Test success, validation failure and refresh persistence.",["react","express"],24],
   ["Protect shared application data","Add sessions and record ownership. Verify authorization on every read and mutation, including direct requests.",["postgresql","web security"],24],
   ["Handle failures across boundaries","Add idempotent submissions and meaningful retry states. Simulate a response lost after a committed database write.",["node.js","sql"],24],
   ["Release with end-to-end evidence","Automate the critical user journey, deploy a staging environment, and document rollback and recovery.",["docker","react testing"],22]],
  advanced:[
   ["Design multi-tenant boundaries","Model tenant isolation from browser to database. Threat-model cross-tenant access and test direct API requests.",["postgresql","web security"],30],
   ["Coordinate distributed state","Implement an asynchronous workflow with an outbox, status UI and safe retries. Test duplicate messages and interrupted clients.",["node.js","react","sql"],32],
   ["Establish performance budgets","Measure browser and API latency under a documented workload. Identify saturation and compare caching strategies without serving private data across users.",["system design","react"],28],
   ["Practice safe system evolution","Perform an additive schema migration and staged release. Verify old and new clients, rollback limits and recovery procedures.",["postgresql","docker"],28]]},
 "ai-machine-learning":{
  intermediate:[
   ["Establish a leakage-free baseline","Split a dataset before preprocessing, train a baseline and document the target metric. Demonstrate a leakage check.",["python","scikit learn"],22],
   ["Evaluate and tune responsibly","Compare candidate models with cross-validation and an untouched holdout. Report uncertainty and subgroup errors.",["scikit learn","machine learning"],26],
   ["Train a reproducible neural model","Train a small PyTorch model with fixed splits, saved configuration and checkpoints. Compare against the simpler baseline.",["pytorch","deep learning"],28],
   ["Serve and monitor predictions","Package inference with input validation and latency measurements. Define drift indicators and a retraining decision process.",["python","machine learning"],24]],
  advanced:[
   ["Design a rigorous evaluation suite","Build task-specific evaluation data with failure categories and a held-out set. Compare models with confidence intervals and cost measurements.",["machine learning","python"],30],
   ["Investigate model failure modes","Run ablations and subgroup evaluations. Trace representative errors to data, optimization or model assumptions and test one intervention.",["pytorch","scikit learn"],30],
   ["Optimize constrained inference","Measure throughput, memory and latency under a reproducible workload. Compare batching or quantization while tracking quality regressions.",["pytorch","transformers"],30],
   ["Operate a governed model release","Version datasets and artifacts, define acceptance gates and rehearse rollback. Document privacy limitations and monitoring response procedures.",["python","machine learning"],28]]},
 "data-science":{
  intermediate:[
   ["Build a trustworthy analysis dataset","Join messy sources with explicit keys and missing-value rules. Add checks for duplication, unexpected ranges and join inflation.",["pandas","sql"],22],
   ["Answer a decision with uncertainty","Frame a business question, choose an estimator and report confidence intervals. Document sampling limitations and alternative explanations.",["statistics","python"],24],
   ["Validate a predictive analysis","Build a baseline and cross-validation pipeline. Demonstrate that preprocessing uses training data only and report holdout performance.",["scikit learn","pandas"],24],
   ["Communicate a reproducible recommendation","Produce an executable notebook and decision memo. Include assumptions, visual evidence and checks a reviewer can rerun.",["python","data visualization"],20]],
  advanced:[
   ["Design an experiment for a decision","Specify randomization, metrics and stopping rules before analysis. Simulate power and identify threats to validity.",["statistics","python"],28],
   ["Evaluate causal assumptions","Draw a causal diagram and compare an observational estimate with sensitivity checks. State which effects cannot be identified.",["statistics","pandas"],30],
   ["Analyze drift and segmented uncertainty","Evaluate temporal validation and subgroup stability. Quantify how uncertainty changes the proposed decision.",["scikit learn","statistics"],28],
   ["Build a reviewable analytical product","Automate data-quality checks, lineage and reporting. Reproduce a prior result from versioned inputs and document a decision reversal scenario.",["python","sql"],28]]},
 "devops-cloud":{
  intermediate:[
   ["Package a repeatable environment","Containerize a service with minimal privileges and health checks. Verify configuration and graceful shutdown.",["docker","linux"],22],
   ["Build a guarded delivery pipeline","Automate tests, artifact creation and deployment. Prove failed checks block release and rehearse rollback.",["ci cd","git"],24],
   ["Provision infrastructure reproducibly","Define infrastructure as code with isolated environments. Review a plan and demonstrate controlled teardown without touching shared resources.",["terraform","cloud"],24],
   ["Observe and recover a workload","Add service metrics and actionable alerts. Simulate a dependency outage and run a documented recovery drill.",["kubernetes","docker"],24]],
  advanced:[
   ["Design reliability targets","Define SLIs, SLOs and an error-budget policy for a service. Use workload measurements to justify capacity and scaling limits.",["kubernetes","cloud"],28],
   ["Harden workload and supply-chain access","Minimize runtime privileges, review image provenance and isolate credentials. Test denied access and a credential rotation.",["docker","kubernetes"],30],
   ["Exercise failure and disaster recovery","Run controlled failure scenarios in an isolated environment. Measure recovery time and data-loss bounds against declared targets.",["kubernetes","terraform"],30],
   ["Evolve infrastructure safely","Design progressive delivery and an infrastructure migration. Review blast radius, compatibility, rollback limits and operating cost.",["terraform","ci cd"],28]]}
};
export function experiencedCurriculum(field:string,level:"intermediate"|"advanced") {
 const plan=units[field]?.[level];if(!plan)throw new Error("Missing curriculum: "+field);
 return plan.map(([title,task,search_topics,estimated_hours],order_index):SkeletonStage & {practice_check:string}=>({title,description:task,search_topics,estimated_hours,order_index,practice_check:task+" Submit your implementation or analysis, reproducible checks, and a short explanation of the tradeoffs."}));
}
