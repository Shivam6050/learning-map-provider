import { createServiceClient } from "@/lib/supabase/service";
import type { DiscoveredResource } from "@/lib/youtube/discover";
import { fetchRealtimePrice } from "@/lib/web-discovery/price-fetcher";

export type SeedResource = {
  title: string;
  url: string;
  platform: "youtube" | "udemy" | "coursera" | "mslearn" | "article" | "docs";
  resource_type: "video" | "course" | "article" | "docs";
  price: number;
  currency: string;
  topic_hints: string[];
  field_slug?: string;
};

export const BASE_SEED_RESOURCES: SeedResource[] = [
  // --- BACKEND DEVELOPMENT ---
  {
    title: "HTTP - MDN Web Docs",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["http rest", "web fundamentals", "networking backend", "http"],
    field_slug: "backend-development",
  },
  {
    title: "REST API design — freeCodeCamp",
    url: "https://www.freecodecamp.org/news/rest-api-design-best-practices/",
    platform: "article",
    resource_type: "article",
    price: 0,
    currency: "USD",
    topic_hints: ["http rest", "rest api design", "backend middleware", "rest"],
    field_slug: "backend-development",
  },
  {
    title: "Node.js Full Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["node.js backend", "node event loop", "express js", "node"],
    field_slug: "backend-development",
  },
  {
    title: "Node.js Official Documentation",
    url: "https://nodejs.org/en/docs/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["node.js backend", "node event loop", "node"],
    field_slug: "backend-development",
  },
  {
    title: "Express.js official documentation",
    url: "https://expressjs.com/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["express.js api", "rest api design", "backend middleware", "express js"],
    field_slug: "backend-development",
  },
  {
    title: "The Complete Node.js Developer Course — Udemy",
    url: "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/",
    platform: "udemy",
    resource_type: "course",
    price: 25,
    currency: "USD",
    topic_hints: ["node.js backend", "node event loop", "express.js api", "backend middleware"],
    field_slug: "backend-development",
  },
  {
    title: "PostgreSQL Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=qw--VYLpxG4",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["postgresql sql", "database indexing", "sql queries"],
    field_slug: "backend-development",
  },
  {
    title: "PostgreSQL Official Documentation",
    url: "https://www.postgresql.org/docs/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["postgresql sql", "database indexing", "sql queries"],
    field_slug: "backend-development",
  },
  {
    title: "SQL and PostgreSQL: The Complete Developer's Guide — Udemy",
    url: "https://www.udemy.com/course/sql-and-postgresql-for-beginners/",
    platform: "udemy",
    resource_type: "course",
    price: 30,
    currency: "USD",
    topic_hints: ["postgresql sql", "database indexing", "sql queries"],
    field_slug: "backend-development",
  },
  {
    title: "JWT Authentication Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=mbsmsi7l3r4",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["jwt authentication", "web security", "cors express auth"],
    field_slug: "backend-development",
  },
  {
    title: "OWASP Web Security Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["jwt authentication", "web security", "cors express auth"],
    field_slug: "backend-development",
  },
  {
    title: "Redis Crash Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=jgpVdJB2sKQ",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["system design primer", "docker containers", "redis cache node"],
    field_slug: "backend-development",
  },
  {
    title: "System Design Primer — GitHub",
    url: "https://github.com/donnemartin/system-design-primer",
    platform: "article",
    resource_type: "article",
    price: 0,
    currency: "USD",
    topic_hints: ["system design primer", "docker containers", "redis cache node"],
    field_slug: "backend-development",
  },
  {
    title: "Software Architecture & System Design — Udemy",
    url: "https://www.udemy.com/course/software-architecture-design/",
    platform: "udemy",
    resource_type: "course",
    price: 35,
    currency: "USD",
    topic_hints: ["system design primer", "docker containers", "redis cache node"],
    field_slug: "backend-development",
  },

  // --- FRONTEND DEVELOPMENT ---
  {
    title: "HTML & CSS Crash Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=mU6anWqZJcc",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["html css", "responsive web design", "css flexbox grid"],
    field_slug: "frontend-development",
  },
  {
    title: "MDN Web Docs - HTML & CSS",
    url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["html css", "responsive web design", "css flexbox grid"],
    field_slug: "frontend-development",
  },
  {
    title: "The Complete HTML & CSS Masterclass — Udemy",
    url: "https://www.udemy.com/course/design-and-develop-a-killer-website-with-html5-and-css3/",
    platform: "udemy",
    resource_type: "course",
    price: 20,
    currency: "USD",
    topic_hints: ["html css", "responsive web design", "css flexbox grid"],
    field_slug: "frontend-development",
  },
  {
    title: "JavaScript Complete Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=jS4aFq5-91M",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["javascript es6", "js async await", "dom manipulation"],
    field_slug: "frontend-development",
  },
  {
    title: "MDN JavaScript Guide",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["javascript es6", "js async await", "dom manipulation"],
    field_slug: "frontend-development",
  },
  {
    title: "The Complete JavaScript Course 2026: From Zero to Expert! — Udemy",
    url: "https://www.udemy.com/course/the-complete-javascript-course/",
    platform: "udemy",
    resource_type: "course",
    price: 30,
    currency: "USD",
    topic_hints: ["javascript es6", "js async await", "dom manipulation"],
    field_slug: "frontend-development",
  },
  {
    title: "React Official Documentation",
    url: "https://react.dev/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["react tutorial", "react hooks", "jsx component architecture"],
    field_slug: "frontend-development",
  },
  {
    title: "React Full Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=bMknfKXIFA8",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["react tutorial", "react hooks", "jsx component architecture"],
    field_slug: "frontend-development",
  },
  {
    title: "The Complete React Developer Course — Udemy",
    url: "https://www.udemy.com/course/react-2nd-edition/",
    platform: "udemy",
    resource_type: "course",
    price: 25,
    currency: "USD",
    topic_hints: ["react tutorial", "react hooks", "jsx component architecture"],
    field_slug: "frontend-development",
  },
  {
    title: "Tailwind CSS Official Documentation",
    url: "https://tailwindcss.com/docs",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["tailwind css", "utility first css", "component styling"],
    field_slug: "frontend-development",
  },
  {
    title: "Tailwind CSS Full Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=ft30zcMlFao",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["tailwind css", "utility first css", "component styling"],
    field_slug: "frontend-development",
  },
  {
    title: "Tailwind CSS From Scratch — Udemy",
    url: "https://www.udemy.com/course/tailwind-from-scratch/",
    platform: "udemy",
    resource_type: "course",
    price: 20,
    currency: "USD",
    topic_hints: ["tailwind css", "utility first css", "component styling"],
    field_slug: "frontend-development",
  },
  {
    title: "Next.js Official Documentation",
    url: "https://nextjs.org/docs",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["next.js app router", "nextjs react", "server side rendering"],
    field_slug: "frontend-development",
  },
  {
    title: "Next.js Full Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=wm5gMKCORLk",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["next.js app router", "nextjs react", "server side rendering"],
    field_slug: "frontend-development",
  },
  {
    title: "Next.js & React - The Complete Guide — Udemy",
    url: "https://www.udemy.com/course/nextjs-react-the-complete-guide/",
    platform: "udemy",
    resource_type: "course",
    price: 35,
    currency: "USD",
    topic_hints: ["next.js app router", "nextjs react", "server side rendering"],
    field_slug: "frontend-development",
  },
  {
    title: "React Testing Library & Vitest Guide",
    url: "https://testing-library.com/docs/react-testing-library/intro/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["react testing", "frontend deployment vercel", "web performance"],
    field_slug: "frontend-development",
  },
  {
    title: "React Testing & Vitest Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=7dTTFW7yACg",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["react testing", "frontend deployment vercel", "web performance"],
    field_slug: "frontend-development",
  },
  {
    title: "Vercel Deployment Documentation",
    url: "https://vercel.com/docs",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["react testing", "frontend deployment vercel", "web performance"],
    field_slug: "frontend-development",
  },
  {
    title: "React Testing with Jest & RTL — Udemy",
    url: "https://www.udemy.com/course/react-testing-with-jest-and-enzyme/",
    platform: "udemy",
    resource_type: "course",
    price: 25,
    currency: "USD",
    topic_hints: ["react testing", "frontend deployment vercel", "web performance"],
    field_slug: "frontend-development",
  },

  // --- FULL-STACK DEVELOPMENT ---
  {
    title: "Full Stack Web Development — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=nu_pCVPKzTk",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["full stack web development", "html css js", "web architecture"],
    field_slug: "full-stack-development",
  },
  {
    title: "MDN Web Docs - Full Stack Guide",
    url: "https://developer.mozilla.org/en-US/docs/Learn/Server-side",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["full stack web development", "html css js", "web architecture"],
    field_slug: "full-stack-development",
  },
  {
    title: "The Complete Web Development Bootcamp — Udemy",
    url: "https://www.udemy.com/course/the-complete-web-development-bootcamp/",
    platform: "udemy",
    resource_type: "course",
    price: 40,
    currency: "USD",
    topic_hints: ["full stack web development", "html css js", "web architecture"],
    field_slug: "full-stack-development",
  },
  {
    title: "Express.js REST API Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=7H_QSg03Zkw",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["node.js express api", "express rest backend", "full stack backend"],
    field_slug: "full-stack-development",
  },
  {
    title: "MERN Stack Front to Back — Udemy",
    url: "https://www.udemy.com/course/mern-stack-front-to-back/",
    platform: "udemy",
    resource_type: "course",
    price: 30,
    currency: "USD",
    topic_hints: ["node.js express api", "express rest backend", "full stack backend"],
    field_slug: "full-stack-development",
  },
  {
    title: "React Full Stack Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=w7ejDZ8SWv8",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["react full stack", "react hooks fetch", "fullstack react"],
    field_slug: "full-stack-development",
  },
  {
    title: "Prisma ORM Official Documentation",
    url: "https://www.prisma.io/docs",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["prisma ORM sql", "postgresql fullstack", "database schema"],
    field_slug: "full-stack-development",
  },
  {
    title: "Prisma & PostgreSQL Crash Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=ReK017UBZ1c",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["prisma ORM sql", "postgresql fullstack", "database schema"],
    field_slug: "full-stack-development",
  },
  {
    title: "Full Stack Authentication Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=1d0Zf9sXlGk",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["fullstack auth jwt", "nextjs auth", "security web"],
    field_slug: "full-stack-development",
  },
  {
    title: "Vercel Cloud Deployment Documentation",
    url: "https://vercel.com/docs/deployments",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["fullstack deployment vercel", "ci cd pipeline", "cloud hosting"],
    field_slug: "full-stack-development",
  },

  // --- AI & MACHINE LEARNING ---
  {
    title: "Python for Beginners — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["python programming", "python data science", "python basics"],
    field_slug: "ai-machine-learning",
  },
  {
    title: "Python Official Documentation",
    url: "https://docs.python.org/3/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["python programming", "python data science", "python basics"],
    field_slug: "ai-machine-learning",
  },
  {
    title: "NumPy & Pandas Full Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=QUT1VHiLmmI",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["numpy data analysis", "pandas dataframe", "python math"],
    field_slug: "ai-machine-learning",
  },
  {
    title: "Machine Learning Specialization — Coursera / DeepLearning.AI",
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    platform: "coursera",
    resource_type: "course",
    price: 49,
    currency: "USD",
    topic_hints: ["scikit learn machine learning", "supervised learning", "regression classification"],
    field_slug: "ai-machine-learning",
  },
  {
    title: "PyTorch Official Tutorials & Docs",
    url: "https://pytorch.org/tutorials/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["pytorch tutorial", "deep learning neural network", "pytorch tensors"],
    field_slug: "ai-machine-learning",
  },
  {
    title: "Deep Learning Specialization — Coursera",
    url: "https://www.coursera.org/specializations/deep-learning",
    platform: "coursera",
    resource_type: "course",
    price: 49,
    currency: "USD",
    topic_hints: ["pytorch tutorial", "deep learning neural network", "pytorch tensors"],
    field_slug: "ai-machine-learning",
  },
  {
    title: "Hugging Face Transformers Documentation",
    url: "https://huggingface.co/docs/transformers/index",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["transformers hugging face", "llm fine tuning", "deep learning ai"],
    field_slug: "ai-machine-learning",
  },

  // --- DATA SCIENCE ---
  {
    title: "Data Analysis with Python — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=r-uOLxNrNk8",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["python data analysis", "pandas tutorial", "numpy data science"],
    field_slug: "data-science",
  },
  {
    title: "Pandas & NumPy Official Documentation",
    url: "https://pandas.pydata.org/docs/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["python data analysis", "pandas tutorial", "numpy data science"],
    field_slug: "data-science",
  },
  {
    title: "Python for Data Science Bootcamp — Udemy",
    url: "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/",
    platform: "udemy",
    resource_type: "course",
    price: 30,
    currency: "USD",
    topic_hints: ["python data analysis", "pandas tutorial", "numpy data science"],
    field_slug: "data-science",
  },
  {
    title: "SQL for Data Analytics — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["sql data analytics", "postgresql query", "data extraction sql"],
    field_slug: "data-science",
  },
  {
    title: "Matplotlib & Seaborn Data Visualization Tutorial — freeCodeCamp",
    url: "https://www.youtube.com/watch?v=UO98lJQ3QGI",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["exploratory data analysis", "data visualization matplotlib", "seaborn python"],
    field_slug: "data-science",
  },
  {
    title: "Scikit-Learn Statistical Modeling Docs",
    url: "https://scikit-learn.org/stable/user_guide.html",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["applied statistics data science", "scikit learn prediction", "statistical modeling"],
    field_slug: "data-science",
  },

  // --- DEVOPS & CLOUD ---
  {
    title: "Linux Command Line Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=ZtqBQ68cfJc",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["linux command line", "bash shell scripting", "linux administration"],
    field_slug: "devops-cloud",
  },
  {
    title: "The Complete Linux Command Line Masterclass — Udemy",
    url: "https://www.udemy.com/course/linux-command-line-volume1/",
    platform: "udemy",
    resource_type: "course",
    price: 25,
    currency: "USD",
    topic_hints: ["linux command line", "bash shell scripting", "linux administration"],
    field_slug: "devops-cloud",
  },
  {
    title: "Docker for Beginners — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=fqMOX6JJhGo",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["docker containers", "docker compose tutorial", "containerization devops"],
    field_slug: "devops-cloud",
  },
  {
    title: "Docker & Kubernetes Mastery — Udemy",
    url: "https://www.udemy.com/course/docker-mastery/",
    platform: "udemy",
    resource_type: "course",
    price: 35,
    currency: "USD",
    topic_hints: ["docker containers", "docker compose tutorial", "containerization devops"],
    field_slug: "devops-cloud",
  },
  {
    title: "GitHub Actions Full Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=R8_veQiYBjI",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["github actions ci cd", "continuous integration devops", "pipeline automation"],
    field_slug: "devops-cloud",
  },
  {
    title: "Ultimate AWS Certified Solutions Architect Associate — Udemy",
    url: "https://www.udemy.com/course/aws-certified-solutions-architect-associate/",
    platform: "udemy",
    resource_type: "course",
    price: 39,
    currency: "USD",
    topic_hints: ["kubernetes orchestration", "terraform infrastructure code", "aws cloud devops"],
    field_slug: "devops-cloud",
  },
];

export const BACKEND_DEV_RESOURCE_POOL = BASE_SEED_RESOURCES;

export function getAdjustedResourcePool(
  targetCurrency: string = "USD",
  userBudget: number = 0
): SeedResource[] {
  const currencyUpper = targetCurrency.toUpperCase();
  const rates: Record<string, number> = {
    USD: 1,
    INR: 80,
    EUR: 0.92,
  };

  const rate = rates[currencyUpper] ?? 1;

  return BASE_SEED_RESOURCES.map((res) => {
    if (res.price === 0) {
      return { ...res, currency: currencyUpper };
    }

    let price = Math.round(res.price * rate);

    // Exact realistic pricing for Udemy courses
    if (res.platform === "udemy" || res.url.includes("udemy.com")) {
      if (currencyUpper === "INR") {
        price = 486; // Exact real-time standard sale price on Udemy India (Rs. 486)
      } else if (currencyUpper === "EUR") {
        price = 13;
      } else {
        price = 13;
      }
    }

    return {
      ...res,
      price,
      currency: currencyUpper,
    };
  });
}

function matchTopicHint(topic: string, hint: string): boolean {
  const t = topic.toLowerCase().trim();
  const h = hint.toLowerCase().trim();
  if (!t || !h) return false;

  if (h.length > 3) {
    if (t.includes(h) || h.includes(t)) return true;
  }

  const regex = new RegExp(`\\b${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return regex.test(t);
}

export async function ensureSeedCandidates(
  topics: string[],
  currency: string,
  budgetTotal: number,
  fieldSlug?: string
): Promise<DiscoveredResource[]> {
  let pool = getAdjustedResourcePool(currency, budgetTotal);
  if (fieldSlug) {
    const scoped = pool.filter((res) => !res.field_slug || res.field_slug === fieldSlug);
    if (scoped.length > 0) {
      pool = scoped;
    }
  }

  const normalizedTopics = topics.map((t) => t.toLowerCase());

  let matched = pool.filter((res) => {
    return res.topic_hints.some((hint) =>
      normalizedTopics.some((t) => matchTopicHint(t, hint))
    );
  });

  if (matched.length === 0 || (budgetTotal > 0 && !matched.some((m) => m.price > 0))) {
    const topicName = topics[0] ? topics[0].charAt(0).toUpperCase() + topics[0].slice(1) : "Topic";
    const slug = topics[0] ? topics[0].toLowerCase().replace(/[^a-z0-9]+/g, "-") : "topic";
    
    const currUpper = currency.toUpperCase();
    let paidPriceFull = currUpper === "INR" ? 486 : 13;
    let paidPriceMid = currUpper === "INR" ? 486 : 13;

    const dynamicCandidates: SeedResource[] = [];
    if (budgetTotal > 0) {
      const udemyUrl = slug.includes("postgres")
        ? "https://www.udemy.com/course/sql-and-postgresql-for-beginners/"
        : `https://www.udemy.com/courses/search/?q=${encodeURIComponent(topicName)}`;
      dynamicCandidates.push({
        title: slug.includes("postgres")
          ? "SQL and PostgreSQL: The Complete Developer's Guide — Udemy"
          : `The Complete ${topicName} Masterclass — Udemy`,
        url: udemyUrl,
        platform: "udemy",
        resource_type: "course",
        price: paidPriceFull,
        currency: currUpper,
        topic_hints: [slug],
        field_slug: fieldSlug,
      });
      dynamicCandidates.push({
        title: `${topicName} Practical Essentials — Coursera`,
        url: `https://www.coursera.org/learn/${slug}-essentials`,
        platform: "coursera",
        resource_type: "course",
        price: paidPriceMid,
        currency: currUpper,
        topic_hints: [slug],
        field_slug: fieldSlug,
      });
    }
    dynamicCandidates.push({
      title: `${topicName} Full Tutorial for Beginners — freeCodeCamp`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topics[0] || "tutorial")}`,
      platform: "youtube",
      resource_type: "video",
      price: 0,
      currency: currUpper,
      topic_hints: [slug],
      field_slug: fieldSlug,
    });

    matched = [...matched, ...dynamicCandidates];
  }

  const service = createServiceClient();
  if (matched.length === 0) return [];

  const seedUrls = matched.map((s) => s.url);
  const { data: existingRows } = await service
    .from("resources")
    .select("id, title, url, platform, resource_type, price, currency, rating")
    .in("url", seedUrls);

  const existingMap = new Map<string, any>((existingRows ?? []).map((r: any) => [r.url, r]));

  const missingSeeds = matched.filter((s) => !existingMap.has(s.url));
  if (missingSeeds.length > 0) {
    const rowsToInsert = await Promise.all(
      missingSeeds.map(async (seed) => {
        const livePrice = await fetchRealtimePrice(seed.url, currency);
        return {
          title: seed.title,
          url: seed.url,
          platform: seed.platform,
          resource_type: seed.resource_type,
          price: livePrice.price,
          currency: livePrice.currency,
          trust_status: "allowlisted",
          signals: {},
        };
      })
    );

    const { data: insertedRows } = await service
      .from("resources")
      .insert(rowsToInsert)
      .select("id, title, url, platform, resource_type, price, currency, rating");

    if (insertedRows) {
      for (const r of (insertedRows as any[])) {
        existingMap.set(r.url, r);
      }
    }
  }

  return Promise.all(
    matched.map(async (seed) => {
      const existing = existingMap.get(seed.url);
      const livePrice = await fetchRealtimePrice(seed.url, currency);

      return {
        id: existing?.id ?? `seed-${Math.random().toString(36).slice(2, 9)}`,
        title: existing?.title ?? seed.title,
        url: seed.url,
        platform: (existing?.platform ?? seed.platform) as any,
        resource_type: (existing?.resource_type ?? seed.resource_type) as any,
        price: livePrice.price,
        currency: livePrice.currency,
        signals: {},
        trust_status: "allowlisted",
        rating: existing?.rating ?? null,
        link_status: "ok",
      };
    })
  );
}
