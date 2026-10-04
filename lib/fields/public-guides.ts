import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { curriculumUnits } from "@/lib/paths/authored-curriculum";

// Editorial introductions to the same authored curriculum used by personalized paths.
// These public previews contain no saved paths, account data or provider price claims.
const introductions: Record<string, { summary: string; startingPoint: string; outcome: string }> = {
  "frontend-development": {
    summary: "Learn how to build the part of a website people see and use. Follow HTML and CSS foundations into JavaScript, React, responsive interfaces and deployment.",
    startingPoint: "Start with semantic HTML and a small responsive page. Add JavaScript interactions before moving to a component framework. Test with a keyboard as well as a mouse.",
    outcome: "A working interface you can explain, test and share, with evidence of responsive design and accessible interactions.",
  },
  "backend-development": {
    summary: "Build the services behind a website. This JavaScript-based backend roadmap connects HTTP, Node.js, databases, API design, authentication and reliable deployment.",
    startingPoint: "Begin with requests, responses and JavaScript functions. Build a small HTTP service before adding a framework or database. Other backend languages are valid alternatives; this preview follows Node.js.",
    outcome: "An API with validated inputs, a relational database and account ownership checks, backed by tests and documented failure responses.",
  },
  "full-stack-development": {
    summary: "Connect a frontend interface to a backend service and database. This full-stack developer roadmap builds from web fundamentals to complete applications, testing and deployment.",
    startingPoint: "Make a small HTML and CSS page first, then add JavaScript. Follow one request from the browser through an API to the database before combining more tools.",
    outcome: "An end-to-end application with a usable interface, server-side validation and a database, plus a repeatable test and deployment process.",
  },
  "ai-machine-learning": {
    summary: "Explore Python, mathematical foundations, data preparation and machine learning models. Learn to evaluate results and build reproducible AI experiments rather than rely on a single accuracy score.",
    startingPoint: "Practise Python functions and arrays, then review the statistics and linear algebra needed by your first model. Start with a small, understandable dataset.",
    outcome: "A reproducible model experiment with a justified evaluation approach, documented limitations and an explanation of the data used.",
  },
  "data-science": {
    summary: "Turn data into questions you can investigate. Follow a data science learning path through Python, SQL, cleaning, statistics, visualisation and communicating results.",
    startingPoint: "Choose a question and inspect a small dataset. Learn Python and SQL alongside checks for missing values, unexpected records and misleading comparisons.",
    outcome: "A documented analysis that someone else can reproduce, with clear charts, data quality checks and conclusions supported by evidence.",
  },
  "devops-cloud": {
    summary: "Learn the foundations of running software reliably. This DevOps and cloud roadmap covers Linux, version control, containers, delivery pipelines and operational recovery.",
    startingPoint: "Get comfortable with the command line, Git and permissions. Run a small service locally before packaging it in a container or deploying it to a cloud environment.",
    outcome: "A reproducible delivery workflow with configuration kept outside the application, release checks and a rehearsed recovery procedure.",
  },
};

export function getPublicGuide(slug: string) {
  const field = FIELD_CATALOG.find(item => item.slug === slug);
  const intro = introductions[slug];
  if (!field || !intro) return undefined;
  const units = curriculumUnits.filter(unit => unit.field === slug);
  return { ...field, ...intro, units };
}

export const PUBLIC_GUIDE_PATHS = FIELD_CATALOG.map(field => `/roadmaps/${field.slug}`);
