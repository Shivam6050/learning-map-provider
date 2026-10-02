// Original LearningMap curricula. Exact stage titles avoid guessing content from keywords.
export const topicDefinitions:Record<string,[string,string]>={
 "html.semantic": [
  "Semantic HTML",
  "Build a page with meaningful landmarks and labelled inputs."
 ],
 "css.layout": [
  "Responsive layouts",
  "Demonstrate a usable layout at narrow and wide viewport sizes."
 ],
 "js.functions": [
  "Functions and collections",
  "Transform a collection with reusable functions and explain the output."
 ],
 "js.async": [
  "Asynchronous JavaScript",
  "Handle success and failure from an asynchronous operation."
 ],
 "react.components": [
  "Components and props",
  "Compose a UI from reusable components with explicit props."
 ],
 "react.state": [
  "State and effects",
  "Demonstrate an interaction and explain where its state belongs."
 ],
 "ui.accessibility": [
  "Keyboard and focus access",
  "Complete the main interaction with a keyboard and verify focus restoration."
 ],
 "ui.races": [
  "Async UI race conditions",
  "Prove a stale response cannot replace the latest user request."
 ],
 "ui.system": [
  "Component contracts",
  "Document component variants, inputs and feedback states."
 ],
 "web.rendering": [
  "Rendering boundaries",
  "Explain which work runs on the server or client and why."
 ],
 "web.caching": [
  "Cache invalidation",
  "Demonstrate a fresh update without leaking private cached data."
 ],
 "web.performance": [
  "Interaction measurement",
  "Record a reproducible before-and-after latency measurement."
 ],
 "http.methods": [
  "Requests and responses",
  "Demonstrate a request and explain its method, headers and status code."
 ],
 "api.validation": [
  "API input validation",
  "Reject invalid input with a consistent error response."
 ],
 "api.contracts": [
  "API contracts",
  "Document the request and response shapes and a failure response."
 ],
 "node.runtime": [
  "Node runtime and modules",
  "Build a module using asynchronous I/O and explain its execution."
 ],
 "sql.schema": [
  "Relational constraints",
  "Define keys and constraints preventing invalid records."
 ],
 "sql.queries": [
  "Queries and joins",
  "Write a join and explain which rows it includes or excludes."
 ],
 "sql.transactions": [
  "Transaction correctness",
  "Demonstrate a concurrent write scenario with no invalid committed state."
 ],
 "sql.plans": [
  "Query plans and indexes",
  "Compare a query plan before and after an index change."
 ],
 "auth.sessions": [
  "Session lifecycle",
  "Demonstrate sign-in, session expiry and sign-out handling."
 ],
 "auth.ownership": [
  "Record ownership",
  "Prove one account cannot read or mutate another account's record."
 ],
 "security.threats": [
  "Threat modelling",
  "Trace one threat to a trust boundary and document its mitigation."
 ],
 "distributed.idempotency": [
  "Idempotent operations",
  "Prove repeating a request does not duplicate its business effect."
 ],
 "distributed.outbox": [
  "Durable asynchronous delivery",
  "Show recovery from duplicate delivery and interrupted processing."
 ],
 "ops.backpressure": [
  "Bounded load and deadlines",
  "Demonstrate overload behaviour with bounded queues and timeouts."
 ],
 "ops.observability": [
  "Actionable telemetry",
  "Use a health check, metric or structured log to diagnose a failure."
 ],
 "ops.recovery": [
  "Recovery and rollback",
  "Rehearse recovery in an isolated environment and record the result."
 ],
 "docker.images": [
  "Container images",
  "Build and run an image with configuration supplied outside the image."
 ],
 "linux.permissions": [
  "Processes and permissions",
  "Explain the permissions required by a script and run it with minimal access."
 ],
 "ci.gates": [
  "Release gates",
  "Demonstrate that a failed check prevents release."
 ],
 "iac.environments": [
  "Infrastructure as code",
  "Review a plan separating test resources from shared infrastructure."
 ],
 "k8s.workloads": [
  "Orchestrated workloads",
  "Explain a workload configuration, health probes and a rollout failure."
 ],
 "ops.slo": [
  "Reliability targets",
  "Define a measurable SLI and explain the proposed SLO."
 ],
 "ops.supplychain": [
  "Artifact and credential trust",
  "Document artifact provenance and demonstrate denied credential access."
 ],
 "python.collections": [
  "Python data processing",
  "Load input data and transform it with reusable Python functions."
 ],
 "data.cleaning": [
  "Data quality and joins",
  "Check missing values, duplicates and unexpected join inflation."
 ],
 "data.arrays": [
  "Numerical arrays",
  "Explain array shape and demonstrate a vectorized operation."
 ],
 "data.visuals": [
  "Exploratory visualization",
  "Produce a labelled chart and state a limitation of its interpretation."
 ],
 "stats.uncertainty": [
  "Estimation and uncertainty",
  "Report an estimate with uncertainty and explain sampling assumptions."
 ],
 "stats.experiments": [
  "Experiment design",
  "Specify assignment, metrics and stopping rules before analysis."
 ],
 "stats.causality": [
  "Causal assumptions",
  "State confounders and which effects the design cannot identify."
 ],
 "ml.splits": [
  "Leakage-free validation",
  "Split before preprocessing and demonstrate that holdout data stays untouched."
 ],
 "ml.baselines": [
  "Baseline comparisons",
  "Compare a model with a simple baseline using a justified metric."
 ],
 "ml.errors": [
  "Subgroup and error analysis",
  "Compare representative failure categories or subgroup errors."
 ],
 "ml.neural": [
  "Neural training",
  "Record loss, configuration and a checkpoint for a reproducible training run."
 ],
 "ml.inference": [
  "Inference constraints",
  "Measure latency, memory and quality under a documented workload."
 ],
 "ml.transformers": [
  "Transformer adaptation",
  "Explain tokenization and evaluate an adaptation against a baseline."
 ],
 "ml.governance": [
  "Artifact and data versions",
  "Reproduce a result using versioned inputs and document rollback limits."
 ]
};
export type CurriculumUnit={field:string;level:string;title:string;topicIds:string[];project:string;prerequisiteIds:string[]};
export const curriculumUnits:CurriculumUnit[]=[
 {
  "field": "frontend-development",
  "level": "beginner",
  "title": "Web & HTML/CSS Fundamentals",
  "topicIds": [
   "html.semantic",
   "css.layout"
  ],
  "project": "Create a responsive reading-list page with semantic headings, a labelled form and a keyboard-accessible navigation.",
  "prerequisiteIds": []
 },
 {
  "field": "frontend-development",
  "level": "beginner",
  "title": "JavaScript ES6+ Core Principles",
  "topicIds": [
   "js.functions",
   "js.async"
  ],
  "project": "Build a browser reading-list tool that filters books and handles a failed data request.",
  "prerequisiteIds": [
   "html.semantic",
   "css.layout"
  ]
 },
 {
  "field": "frontend-development",
  "level": "beginner",
  "title": "React Component Architecture & State",
  "topicIds": [
   "react.components",
   "react.state"
  ],
  "project": "Build a React reading-list interface with reusable cards, add/remove actions and explicit state.",
  "prerequisiteIds": [
   "js.functions",
   "js.async"
  ]
 },
 {
  "field": "frontend-development",
  "level": "beginner",
  "title": "Modern Styling & Tailwind CSS",
  "topicIds": [
   "css.layout",
   "ui.system"
  ],
  "project": "Create a responsive component gallery with documented button, form and card variants.",
  "prerequisiteIds": [
   "react.components",
   "react.state"
  ]
 },
 {
  "field": "frontend-development",
  "level": "beginner",
  "title": "Next.js Full-Stack App Router & SSR",
  "topicIds": [
   "web.rendering",
   "web.caching"
  ],
  "project": "Build a reading-list detail page using server-rendered data and a small client interaction; document cache behaviour.",
  "prerequisiteIds": [
   "css.layout",
   "ui.system"
  ]
 },
 {
  "field": "frontend-development",
  "level": "beginner",
  "title": "Frontend Testing & Deployment",
  "topicIds": [
   "ui.accessibility",
   "ci.gates"
  ],
  "project": "Test the reading-list journey at mobile widths and deploy a test build with a release checklist.",
  "prerequisiteIds": [
   "web.rendering",
   "web.caching"
  ]
 },
 {
  "field": "backend-development",
  "level": "beginner",
  "title": "HTTP Protocol & Web Architecture",
  "topicIds": [
   "http.methods",
   "api.contracts"
  ],
  "project": "Implement a tiny HTTP service with a successful response, a not-found response and documented request examples.",
  "prerequisiteIds": []
 },
 {
  "field": "backend-development",
  "level": "beginner",
  "title": "Node.js Core Runtime & Modules",
  "topicIds": [
   "node.runtime",
   "js.async"
  ],
  "project": "Build a Node command-line tool that reads a local JSON file asynchronously and reports malformed input.",
  "prerequisiteIds": [
   "http.methods",
   "api.contracts"
  ]
 },
 {
  "field": "backend-development",
  "level": "beginner",
  "title": "RESTful API Design & Express Framework",
  "topicIds": [
   "api.validation",
   "api.contracts"
  ],
  "project": "Build a reading-list CRUD API with validation, pagination and consistent error responses.",
  "prerequisiteIds": [
   "node.runtime",
   "js.async"
  ]
 },
 {
  "field": "backend-development",
  "level": "beginner",
  "title": "SQL & Relational Database Modeling",
  "topicIds": [
   "sql.schema",
   "sql.queries",
   "sql.transactions"
  ],
  "project": "Store a reading list in PostgreSQL with keys, constraints and a query joining books to readers.",
  "prerequisiteIds": [
   "api.validation",
   "api.contracts"
  ]
 },
 {
  "field": "backend-development",
  "level": "beginner",
  "title": "Authentication, Authorization & Security",
  "topicIds": [
   "auth.sessions",
   "auth.ownership"
  ],
  "project": "Add two test accounts to the reading-list API and prove their private records remain isolated.",
  "prerequisiteIds": [
   "sql.schema",
   "sql.queries",
   "sql.transactions"
  ]
 },
 {
  "field": "backend-development",
  "level": "beginner",
  "title": "System Architecture, Caching & Deployment",
  "topicIds": [
   "web.caching",
   "docker.images",
   "ops.recovery"
  ],
  "project": "Package the API in a container, document cache invalidation and practise recovery from a failed dependency.",
  "prerequisiteIds": [
   "auth.sessions",
   "auth.ownership"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "beginner",
  "title": "Full-Stack Web Foundations",
  "topicIds": [
   "html.semantic",
   "http.methods"
  ],
  "project": "Build a static reading-list page and diagram how a browser request reaches an API and database.",
  "prerequisiteIds": []
 },
 {
  "field": "full-stack-development",
  "level": "beginner",
  "title": "Server Development with Node.js & Express",
  "topicIds": [
   "api.validation",
   "node.runtime"
  ],
  "project": "Implement the reading-list API with validation and a documented JSON contract.",
  "prerequisiteIds": [
   "html.semantic",
   "http.methods"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "beginner",
  "title": "React Frontend & State Management",
  "topicIds": [
   "react.components",
   "react.state"
  ],
  "project": "Connect a React reading-list client to the API with loading, success and error states.",
  "prerequisiteIds": [
   "api.validation",
   "node.runtime"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "beginner",
  "title": "Database Integration & Prisma ORM",
  "topicIds": [
   "sql.schema",
   "sql.queries"
  ],
  "project": "Persist reading-list records using a schema migration and demonstrate refresh persistence.",
  "prerequisiteIds": [
   "react.components",
   "react.state"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "beginner",
  "title": "User Auth & Full-Stack Security",
  "topicIds": [
   "auth.sessions",
   "auth.ownership"
  ],
  "project": "Add account sessions and test ownership through both the UI and direct API calls.",
  "prerequisiteIds": [
   "sql.schema",
   "sql.queries"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "beginner",
  "title": "Production CI/CD & Cloud Deployment",
  "topicIds": [
   "ci.gates",
   "ops.recovery"
  ],
  "project": "Deploy an isolated test version of the app through an automated pipeline and document rollback.",
  "prerequisiteIds": [
   "auth.sessions",
   "auth.ownership"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "beginner",
  "title": "Python for Data & AI Engineering",
  "topicIds": [
   "python.collections",
   "data.cleaning"
  ],
  "project": "Write a Python tool that loads a small public dataset, validates columns and summarizes missing values.",
  "prerequisiteIds": []
 },
 {
  "field": "ai-machine-learning",
  "level": "beginner",
  "title": "Mathematical Computing with NumPy & Pandas",
  "topicIds": [
   "data.arrays",
   "data.cleaning"
  ],
  "project": "Create a notebook comparing a vectorized NumPy calculation with a Pandas data-cleaning workflow.",
  "prerequisiteIds": [
   "python.collections",
   "data.cleaning"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "beginner",
  "title": "Supervised Machine Learning Algorithms",
  "topicIds": [
   "ml.splits",
   "ml.baselines"
  ],
  "project": "Train a simple classifier on a public dataset with a fixed split and compare it with a majority-class baseline.",
  "prerequisiteIds": [
   "data.arrays",
   "data.cleaning"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "beginner",
  "title": "Deep Learning & Neural Networks with PyTorch",
  "topicIds": [
   "ml.neural",
   "ml.baselines"
  ],
  "project": "Train a small neural classifier with a fixed configuration, recorded losses and a saved checkpoint.",
  "prerequisiteIds": [
   "ml.splits",
   "ml.baselines"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "beginner",
  "title": "Transformers & Large Language Models (LLMs)",
  "topicIds": [
   "ml.transformers",
   "ml.errors"
  ],
  "project": "Evaluate a pretrained text model on a small documented held-out set and report representative failures.",
  "prerequisiteIds": [
   "ml.neural",
   "ml.baselines"
  ]
 },
 {
  "field": "data-science",
  "level": "beginner",
  "title": "Python & Data Analysis Foundations",
  "topicIds": [
   "python.collections",
   "data.cleaning"
  ],
  "project": "Build a Python notebook that loads a public dataset and records cleaning decisions.",
  "prerequisiteIds": []
 },
 {
  "field": "data-science",
  "level": "beginner",
  "title": "SQL Data Extraction & Transformation",
  "topicIds": [
   "sql.queries",
   "data.cleaning"
  ],
  "project": "Query a sample orders database to summarize revenue by group and validate the join counts.",
  "prerequisiteIds": [
   "python.collections",
   "data.cleaning"
  ]
 },
 {
  "field": "data-science",
  "level": "beginner",
  "title": "Exploratory Data Analysis & Visualization",
  "topicIds": [
   "data.visuals",
   "stats.uncertainty"
  ],
  "project": "Produce a short exploratory report with labelled plots, missing-data notes and one actionable question.",
  "prerequisiteIds": [
   "sql.queries",
   "data.cleaning"
  ]
 },
 {
  "field": "data-science",
  "level": "beginner",
  "title": "Statistical Modeling & Predictive Analytics",
  "topicIds": [
   "ml.baselines",
   "stats.uncertainty"
  ],
  "project": "Compare a simple predictor with a baseline and report uncertainty and the limits of the conclusion.",
  "prerequisiteIds": [
   "data.visuals",
   "stats.uncertainty"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "beginner",
  "title": "Linux System Administration & Shell Scripting",
  "topicIds": [
   "linux.permissions",
   "ops.observability"
  ],
  "project": "Write a least-privilege shell script that checks a local service and reports a clear failure.",
  "prerequisiteIds": []
 },
 {
  "field": "devops-cloud",
  "level": "beginner",
  "title": "Docker Containerization Essentials",
  "topicIds": [
   "docker.images",
   "ops.recovery"
  ],
  "project": "Containerize a small service with an external configuration and a working health check.",
  "prerequisiteIds": [
   "linux.permissions",
   "ops.observability"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "beginner",
  "title": "Automated CI/CD Workflows",
  "topicIds": [
   "ci.gates",
   "ops.recovery"
  ],
  "project": "Build a test pipeline that blocks a deliberately failing change and only publishes passing artifacts.",
  "prerequisiteIds": [
   "docker.images",
   "ops.recovery"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "beginner",
  "title": "Kubernetes Orchestration & Infrastructure as Code",
  "topicIds": [
   "k8s.workloads",
   "iac.environments"
  ],
  "project": "Deploy a sample workload in an isolated local cluster and review an infrastructure plan without changing shared resources.",
  "prerequisiteIds": [
   "ci.gates",
   "ops.recovery"
  ]
 },
 {
  "field": "frontend-development",
  "level": "intermediate",
  "title": "Build accessible interaction patterns",
  "topicIds": [
   "html.semantic",
   "ui.accessibility"
  ],
  "project": "Build a searchable combobox and modal. Verify keyboard navigation, focus restoration and screen-reader labels.",
  "prerequisiteIds": [
   "ui.accessibility",
   "ci.gates"
  ]
 },
 {
  "field": "frontend-development",
  "level": "intermediate",
  "title": "Manage asynchronous interface state",
  "topicIds": [
   "react.state",
   "ui.races"
  ],
  "project": "Build a React search interface handling stale responses, cancellation, errors and retry. Test rapid changes and slow networks.",
  "prerequisiteIds": [
   "html.semantic",
   "ui.accessibility"
  ]
 },
 {
  "field": "frontend-development",
  "level": "intermediate",
  "title": "Create a reusable component system",
  "topicIds": [
   "ui.system",
   "css.layout"
  ],
  "project": "Implement consistent forms, feedback and responsive layouts. Document variants and check contrast across states.",
  "prerequisiteIds": [
   "react.state",
   "ui.races"
  ]
 },
 {
  "field": "frontend-development",
  "level": "intermediate",
  "title": "Measure and ship a complete interface",
  "topicIds": [
   "web.performance",
   "ui.accessibility"
  ],
  "project": "Test the main journey at mobile widths and under throttling. Record performance measurements and fix the largest verified bottleneck.",
  "prerequisiteIds": [
   "ui.system",
   "css.layout"
  ]
 },
 {
  "field": "frontend-development",
  "level": "advanced",
  "title": "Design rendering and data boundaries",
  "topicIds": [
   "web.rendering",
   "web.caching"
  ],
  "project": "Compare server and client rendering for a data-heavy application. Document caching, invalidation and privacy tradeoffs.",
  "prerequisiteIds": [
   "web.performance",
   "ui.accessibility"
  ]
 },
 {
  "field": "frontend-development",
  "level": "advanced",
  "title": "Profile interaction performance",
  "topicIds": [
   "web.performance",
   "ui.accessibility"
  ],
  "project": "Profile a large interactive list. Improve input latency and memory usage without breaking keyboard access, and publish before/after measurements.",
  "prerequisiteIds": [
   "web.rendering",
   "web.caching"
  ]
 },
 {
  "field": "frontend-development",
  "level": "advanced",
  "title": "Engineer resilient interface contracts",
  "topicIds": [
   "api.contracts",
   "ui.races"
  ],
  "project": "Design typed data contracts and recovery states for versioned APIs. Test malformed responses, race conditions and optimistic rollback.",
  "prerequisiteIds": [
   "web.performance",
   "ui.accessibility"
  ]
 },
 {
  "field": "frontend-development",
  "level": "advanced",
  "title": "Audit and evolve a design system",
  "topicIds": [
   "ui.system",
   "ui.accessibility"
  ],
  "project": "Audit accessibility across a component library and propose a backwards-compatible migration. Demonstrate tests and rollout checks.",
  "prerequisiteIds": [
   "api.contracts",
   "ui.races"
  ]
 },
 {
  "field": "backend-development",
  "level": "intermediate",
  "title": "Build a validated service",
  "topicIds": [
   "api.validation",
   "api.contracts"
  ],
  "project": "Implement a booking API with validation, pagination and consistent errors. Test invalid requests and duplicate submissions.",
  "prerequisiteIds": [
   "web.caching",
   "docker.images",
   "ops.recovery"
  ]
 },
 {
  "field": "backend-development",
  "level": "intermediate",
  "title": "Model reliable data writes",
  "topicIds": [
   "sql.transactions",
   "sql.schema"
  ],
  "project": "Add PostgreSQL transactions and constraints. Prove two concurrent bookings cannot claim the same seat.",
  "prerequisiteIds": [
   "api.validation",
   "api.contracts"
  ]
 },
 {
  "field": "backend-development",
  "level": "intermediate",
  "title": "Enforce ownership and sessions",
  "topicIds": [
   "auth.sessions",
   "auth.ownership"
  ],
  "project": "Add sessions and per-user authorization. Write tests proving one user cannot read or change another user's booking.",
  "prerequisiteIds": [
   "sql.transactions",
   "sql.schema"
  ]
 },
 {
  "field": "backend-development",
  "level": "intermediate",
  "title": "Ship and observe the service",
  "topicIds": [
   "ops.observability",
   "ops.recovery"
  ],
  "project": "Deploy with health checks and structured logs. Reproduce a failed dependency and document recovery steps.",
  "prerequisiteIds": [
   "auth.sessions",
   "auth.ownership"
  ]
 },
 {
  "field": "backend-development",
  "level": "advanced",
  "title": "Design consistency boundaries",
  "topicIds": [
   "distributed.outbox",
   "distributed.idempotency"
  ],
  "project": "Design an order workflow with an outbox and idempotent consumers. Demonstrate recovery after duplicate delivery and partial failure.",
  "prerequisiteIds": [
   "ops.observability",
   "ops.recovery"
  ]
 },
 {
  "field": "backend-development",
  "level": "advanced",
  "title": "Investigate database contention",
  "topicIds": [
   "sql.plans",
   "sql.transactions"
  ],
  "project": "Profile concurrent transactions and slow queries. Compare query plans, indexes and locking before and after a measured change.",
  "prerequisiteIds": [
   "distributed.outbox",
   "distributed.idempotency"
  ]
 },
 {
  "field": "backend-development",
  "level": "advanced",
  "title": "Bound overload and dependency failures",
  "topicIds": [
   "ops.backpressure",
   "web.performance"
  ],
  "project": "Implement bounded queues, deadlines and backpressure. Load-test a degraded dependency and report latency percentiles and failure rates.",
  "prerequisiteIds": [
   "sql.plans",
   "sql.transactions"
  ]
 },
 {
  "field": "backend-development",
  "level": "advanced",
  "title": "Threat-model and operate a service",
  "topicIds": [
   "security.threats",
   "auth.ownership",
   "ops.recovery"
  ],
  "project": "Review tenant isolation and secret handling, run a recovery drill, and write a production readiness review with evidence and remaining risks.",
  "prerequisiteIds": [
   "ops.backpressure",
   "web.performance"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "intermediate",
  "title": "Deliver a complete user journey",
  "topicIds": [
   "api.validation",
   "react.state",
   "sql.queries"
  ],
  "project": "Build a task application from a validated form to an API and database. Test success, validation failure and refresh persistence.",
  "prerequisiteIds": [
   "ci.gates",
   "ops.recovery"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "intermediate",
  "title": "Protect shared application data",
  "topicIds": [
   "auth.sessions",
   "auth.ownership"
  ],
  "project": "Add sessions and record ownership. Verify authorization on every read and mutation, including direct requests.",
  "prerequisiteIds": [
   "api.validation",
   "react.state",
   "sql.queries"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "intermediate",
  "title": "Handle failures across boundaries",
  "topicIds": [
   "distributed.idempotency",
   "ui.races"
  ],
  "project": "Add idempotent submissions and meaningful retry states. Simulate a response lost after a committed database write.",
  "prerequisiteIds": [
   "auth.sessions",
   "auth.ownership"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "intermediate",
  "title": "Release with end-to-end evidence",
  "topicIds": [
   "ci.gates",
   "ops.recovery"
  ],
  "project": "Automate the critical user journey, deploy a staging environment, and document rollback and recovery.",
  "prerequisiteIds": [
   "distributed.idempotency",
   "ui.races"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "advanced",
  "title": "Design multi-tenant boundaries",
  "topicIds": [
   "auth.ownership",
   "security.threats"
  ],
  "project": "Model tenant isolation from browser to database. Threat-model cross-tenant access and test direct API requests.",
  "prerequisiteIds": [
   "ci.gates",
   "ops.recovery"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "advanced",
  "title": "Coordinate distributed state",
  "topicIds": [
   "distributed.outbox",
   "distributed.idempotency"
  ],
  "project": "Implement an asynchronous workflow with an outbox, status UI and safe retries. Test duplicate messages and interrupted clients.",
  "prerequisiteIds": [
   "auth.ownership",
   "security.threats"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "advanced",
  "title": "Establish performance budgets",
  "topicIds": [
   "web.performance",
   "web.caching"
  ],
  "project": "Measure browser and API latency under a documented workload. Identify saturation and compare caching strategies without serving private data across users.",
  "prerequisiteIds": [
   "distributed.outbox",
   "distributed.idempotency"
  ]
 },
 {
  "field": "full-stack-development",
  "level": "advanced",
  "title": "Practice safe system evolution",
  "topicIds": [
   "sql.schema",
   "ops.recovery"
  ],
  "project": "Perform an additive schema migration and staged release. Verify old and new clients, rollback limits and recovery procedures.",
  "prerequisiteIds": [
   "web.performance",
   "web.caching"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "intermediate",
  "title": "Establish a leakage-free baseline",
  "topicIds": [
   "ml.splits",
   "ml.baselines"
  ],
  "project": "Split a dataset before preprocessing, train a baseline and document the target metric. Demonstrate a leakage check.",
  "prerequisiteIds": [
   "ml.transformers",
   "ml.errors"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "intermediate",
  "title": "Evaluate and tune responsibly",
  "topicIds": [
   "ml.errors",
   "stats.uncertainty"
  ],
  "project": "Compare candidate models with cross-validation and an untouched holdout. Report uncertainty and subgroup errors.",
  "prerequisiteIds": [
   "ml.splits",
   "ml.baselines"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "intermediate",
  "title": "Train a reproducible neural model",
  "topicIds": [
   "ml.neural",
   "ml.governance"
  ],
  "project": "Train a small PyTorch model with fixed splits, saved configuration and checkpoints. Compare against the simpler baseline.",
  "prerequisiteIds": [
   "ml.errors",
   "stats.uncertainty"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "intermediate",
  "title": "Serve and monitor predictions",
  "topicIds": [
   "ml.inference",
   "ops.observability"
  ],
  "project": "Package inference with input validation and latency measurements. Define drift indicators and a retraining decision process.",
  "prerequisiteIds": [
   "ml.neural",
   "ml.governance"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "advanced",
  "title": "Design a rigorous evaluation suite",
  "topicIds": [
   "ml.errors",
   "stats.uncertainty"
  ],
  "project": "Build task-specific evaluation data with failure categories and a held-out set. Compare models with confidence intervals and cost measurements.",
  "prerequisiteIds": [
   "ml.inference",
   "ops.observability"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "advanced",
  "title": "Investigate model failure modes",
  "topicIds": [
   "ml.errors",
   "ml.neural"
  ],
  "project": "Run ablations and subgroup evaluations. Trace representative errors to data, optimization or model assumptions and test one intervention.",
  "prerequisiteIds": [
   "ml.errors",
   "stats.uncertainty"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "advanced",
  "title": "Optimize constrained inference",
  "topicIds": [
   "ml.inference",
   "ml.baselines"
  ],
  "project": "Measure throughput, memory and latency under a reproducible workload. Compare batching or quantization while tracking quality regressions.",
  "prerequisiteIds": [
   "ml.errors",
   "ml.neural"
  ]
 },
 {
  "field": "ai-machine-learning",
  "level": "advanced",
  "title": "Operate a governed model release",
  "topicIds": [
   "ml.governance",
   "ops.recovery"
  ],
  "project": "Version datasets and artifacts, define acceptance gates and rehearse rollback. Document privacy limitations and monitoring response procedures.",
  "prerequisiteIds": [
   "ml.inference",
   "ml.baselines"
  ]
 },
 {
  "field": "data-science",
  "level": "intermediate",
  "title": "Build a trustworthy analysis dataset",
  "topicIds": [
   "data.cleaning",
   "sql.queries"
  ],
  "project": "Join messy sources with explicit keys and missing-value rules. Add checks for duplication, unexpected ranges and join inflation.",
  "prerequisiteIds": [
   "ml.baselines",
   "stats.uncertainty"
  ]
 },
 {
  "field": "data-science",
  "level": "intermediate",
  "title": "Answer a decision with uncertainty",
  "topicIds": [
   "stats.uncertainty",
   "data.visuals"
  ],
  "project": "Frame a business question, choose an estimator and report confidence intervals. Document sampling limitations and alternative explanations.",
  "prerequisiteIds": [
   "data.cleaning",
   "sql.queries"
  ]
 },
 {
  "field": "data-science",
  "level": "intermediate",
  "title": "Validate a predictive analysis",
  "topicIds": [
   "ml.splits",
   "ml.baselines"
  ],
  "project": "Build a baseline and cross-validation pipeline. Demonstrate that preprocessing uses training data only and report holdout performance.",
  "prerequisiteIds": [
   "stats.uncertainty",
   "data.visuals"
  ]
 },
 {
  "field": "data-science",
  "level": "intermediate",
  "title": "Communicate a reproducible recommendation",
  "topicIds": [
   "ml.governance",
   "data.visuals"
  ],
  "project": "Produce an executable notebook and decision memo. Include assumptions, visual evidence and checks a reviewer can rerun.",
  "prerequisiteIds": [
   "ml.splits",
   "ml.baselines"
  ]
 },
 {
  "field": "data-science",
  "level": "advanced",
  "title": "Design an experiment for a decision",
  "topicIds": [
   "stats.experiments",
   "stats.uncertainty"
  ],
  "project": "Specify randomization, metrics and stopping rules before analysis. Simulate power and identify threats to validity.",
  "prerequisiteIds": [
   "ml.governance",
   "data.visuals"
  ]
 },
 {
  "field": "data-science",
  "level": "advanced",
  "title": "Evaluate causal assumptions",
  "topicIds": [
   "stats.causality",
   "stats.uncertainty"
  ],
  "project": "Draw a causal diagram and compare an observational estimate with sensitivity checks. State which effects cannot be identified.",
  "prerequisiteIds": [
   "stats.experiments",
   "stats.uncertainty"
  ]
 },
 {
  "field": "data-science",
  "level": "advanced",
  "title": "Analyze drift and segmented uncertainty",
  "topicIds": [
   "ml.errors",
   "ml.splits"
  ],
  "project": "Evaluate temporal validation and subgroup stability. Quantify how uncertainty changes the proposed decision.",
  "prerequisiteIds": [
   "stats.causality",
   "stats.uncertainty"
  ]
 },
 {
  "field": "data-science",
  "level": "advanced",
  "title": "Build a reviewable analytical product",
  "topicIds": [
   "ml.governance",
   "data.cleaning"
  ],
  "project": "Automate data-quality checks, lineage and reporting. Reproduce a prior result from versioned inputs and document a decision reversal scenario.",
  "prerequisiteIds": [
   "ml.errors",
   "ml.splits"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "intermediate",
  "title": "Package a repeatable environment",
  "topicIds": [
   "docker.images",
   "linux.permissions"
  ],
  "project": "Containerize a service with minimal privileges and health checks. Verify configuration and graceful shutdown.",
  "prerequisiteIds": [
   "k8s.workloads",
   "iac.environments"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "intermediate",
  "title": "Build a guarded delivery pipeline",
  "topicIds": [
   "ci.gates",
   "ops.recovery"
  ],
  "project": "Automate tests, artifact creation and deployment. Prove failed checks block release and rehearse rollback.",
  "prerequisiteIds": [
   "docker.images",
   "linux.permissions"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "intermediate",
  "title": "Provision infrastructure reproducibly",
  "topicIds": [
   "iac.environments",
   "security.threats"
  ],
  "project": "Define infrastructure as code with isolated environments. Review a plan and demonstrate controlled teardown without touching shared resources.",
  "prerequisiteIds": [
   "ci.gates",
   "ops.recovery"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "intermediate",
  "title": "Observe and recover a workload",
  "topicIds": [
   "ops.observability",
   "ops.recovery"
  ],
  "project": "Add service metrics and actionable alerts. Simulate a dependency outage and run a documented recovery drill.",
  "prerequisiteIds": [
   "iac.environments",
   "security.threats"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "advanced",
  "title": "Design reliability targets",
  "topicIds": [
   "ops.slo",
   "ops.backpressure"
  ],
  "project": "Define SLIs, SLOs and an error-budget policy for a service. Use workload measurements to justify capacity and scaling limits.",
  "prerequisiteIds": [
   "ops.observability",
   "ops.recovery"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "advanced",
  "title": "Harden workload and supply-chain access",
  "topicIds": [
   "ops.supplychain",
   "linux.permissions"
  ],
  "project": "Minimize runtime privileges, review image provenance and isolate credentials. Test denied access and a credential rotation.",
  "prerequisiteIds": [
   "ops.slo",
   "ops.backpressure"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "advanced",
  "title": "Exercise failure and disaster recovery",
  "topicIds": [
   "ops.recovery",
   "ops.slo"
  ],
  "project": "Run controlled failure scenarios in an isolated environment. Measure recovery time and data-loss bounds against declared targets.",
  "prerequisiteIds": [
   "ops.supplychain",
   "linux.permissions"
  ]
 },
 {
  "field": "devops-cloud",
  "level": "advanced",
  "title": "Evolve infrastructure safely",
  "topicIds": [
   "iac.environments",
   "ci.gates",
   "ops.recovery"
  ],
  "project": "Design progressive delivery and an infrastructure migration. Review blast radius, compatibility, rollback limits and operating cost.",
  "prerequisiteIds": [
   "ops.recovery",
   "ops.slo"
  ]
 }
];
export function curriculumUnit(title:string){return curriculumUnits.find(unit=>unit.title===title);}
