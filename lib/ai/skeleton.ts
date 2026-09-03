import { callForJson } from "@/lib/ai/client";

export type SkeletonStage = {
  order_index: number;
  title: string;
  description: string;
  estimated_hours: number;
  search_topics: string[];
};

const SYSTEM_PROMPT = `You are a curriculum designer. Given a field and a learner's self-reported level, produce an ordered list of learning stages that take a learner from their current level toward competency in the field.

Rules:
- 5 to 9 stages. Fewer for narrow topics, more for broad ones.
- Each stage should represent 1-3 weeks of effort at the learner's stated weekly hours.
- Do not name specific resources, courses, or videos — that happens in a later step. Only describe what the stage covers.
- Output ONLY valid JSON matching the schema below. No prose, no markdown fences.

Schema:
{
  "stages": [
    {
      "order_index": 0,
      "title": "string, max 8 words",
      "description": "string, 1-2 sentences",
      "estimated_hours": integer,
      "search_topics": ["string", ...]
    }
  ]
}`;

const FIELD_FALLBACK_SKELETONS: Record<string, SkeletonStage[]> = {
  "frontend-development": [
    {
      order_index: 0,
      title: "Web & HTML/CSS Fundamentals",
      description: "Master modern semantic HTML5, CSS layout systems (Flexbox and Grid), responsive design, and web accessibilities.",
      estimated_hours: 15,
      search_topics: ["html css", "responsive web design", "css flexbox grid"],
    },
    {
      order_index: 1,
      title: "JavaScript ES6+ Core Principles",
      description: "Learn fundamental JavaScript programming, DOM manipulation, ES6 syntax, async/await, and fetch APIs.",
      estimated_hours: 20,
      search_topics: ["javascript es6", "js async await", "dom manipulation"],
    },
    {
      order_index: 2,
      title: "React Component Architecture & State",
      description: "Build dynamic web interfaces using React functional components, props, hooks (useState, useEffect), and JSX.",
      estimated_hours: 25,
      search_topics: ["react tutorial", "react hooks", "jsx component architecture"],
    },
    {
      order_index: 3,
      title: "Modern Styling & Tailwind CSS",
      description: "Speed up UI development using utility-first CSS with Tailwind CSS and responsive design patterns.",
      estimated_hours: 15,
      search_topics: ["tailwind css", "utility first css", "component styling"],
    },
    {
      order_index: 4,
      title: "Next.js Full-Stack App Router & SSR",
      description: "Build scalable Next.js applications featuring Server-Side Rendering (SSR), Server Components, and App Router.",
      estimated_hours: 25,
      search_topics: ["next.js app router", "nextjs react", "server side rendering"],
    },
    {
      order_index: 5,
      title: "Frontend Testing & Deployment",
      description: "Learn component testing with Vitest/React Testing Library and deploy production web applications to Vercel.",
      estimated_hours: 15,
      search_topics: ["react testing", "frontend deployment vercel", "web performance"],
    },
  ],
  "backend-development": [
    {
      order_index: 0,
      title: "HTTP Protocol & Web Architecture",
      description: "Understand client-server architecture, HTTP request methods, headers, status codes, and URI structures.",
      estimated_hours: 12,
      search_topics: ["http rest", "web fundamentals", "networking backend"],
    },
    {
      order_index: 1,
      title: "Node.js Core Runtime & Modules",
      description: "Learn event-driven asynchronous JavaScript on Node.js, file I/O, event loop, and package management with npm.",
      estimated_hours: 18,
      search_topics: ["node.js backend", "node event loop", "express js"],
    },
    {
      order_index: 2,
      title: "RESTful API Design & Express Framework",
      description: "Design clean REST APIs, implement middleware, request validation, error handling, and routing with Express.",
      estimated_hours: 22,
      search_topics: ["express.js api", "rest api design", "backend middleware"],
    },
    {
      order_index: 3,
      title: "SQL & Relational Database Modeling",
      description: "Design relational database schemas, write SQL queries, handle joins, indexes, transactions, and PostgreSQL setup.",
      estimated_hours: 25,
      search_topics: ["postgresql sql", "database indexing", "sql queries"],
    },
    {
      order_index: 4,
      title: "Authentication, Authorization & Security",
      description: "Implement secure user authentication using JWT, password hashing with bcrypt, session tokens, and CORS policy.",
      estimated_hours: 20,
      search_topics: ["jwt authentication", "web security", "cors express auth"],
    },
    {
      order_index: 5,
      title: "System Architecture, Caching & Deployment",
      description: "Scale backend services using Redis caching, environment configuration, Docker containers, and cloud hosting.",
      estimated_hours: 20,
      search_topics: ["system design primer", "docker containers", "redis cache node"],
    },
  ],
  "full-stack-development": [
    {
      order_index: 0,
      title: "Full-Stack Web Foundations",
      description: "Understand how frontend client interfaces interact with backend servers over HTTP protocols and APIs.",
      estimated_hours: 15,
      search_topics: ["full stack web development", "html css js", "web architecture"],
    },
    {
      order_index: 1,
      title: "Server Development with Node.js & Express",
      description: "Build robust REST APIs, handle JSON requests, and design backend services with Express.js.",
      estimated_hours: 22,
      search_topics: ["node.js express api", "express rest backend", "full stack backend"],
    },
    {
      order_index: 2,
      title: "React Frontend & State Management",
      description: "Build interactive client applications using React components, state hooks, and API data fetching.",
      estimated_hours: 25,
      search_topics: ["react full stack", "react hooks fetch", "fullstack react"],
    },
    {
      order_index: 3,
      title: "Database Integration & Prisma ORM",
      description: "Connect full-stack applications to SQL databases using Prisma ORM for type-safe data modeling and queries.",
      estimated_hours: 20,
      search_topics: ["prisma ORM sql", "postgresql fullstack", "database schema"],
    },
    {
      order_index: 4,
      title: "User Auth & Full-Stack Security",
      description: "Secure full-stack applications with session cookies, JWT authentication, and protected route middleware.",
      estimated_hours: 18,
      search_topics: ["fullstack auth jwt", "nextjs auth", "security web"],
    },
    {
      order_index: 5,
      title: "Production CI/CD & Cloud Deployment",
      description: "Deploy full-stack web applications to modern cloud providers like Vercel and Railway with automated CI/CD.",
      estimated_hours: 15,
      search_topics: ["fullstack deployment vercel", "ci cd pipeline", "cloud hosting"],
    },
  ],
  "ai-machine-learning": [
    {
      order_index: 0,
      title: "Python for Data & AI Engineering",
      description: "Master Python data structures, list comprehensions, object-oriented programming, and file handling.",
      estimated_hours: 18,
      search_topics: ["python programming", "python data science", "python basics"],
    },
    {
      order_index: 1,
      title: "Mathematical Computing with NumPy & Pandas",
      description: "Perform matrix algebra and data manipulation with NumPy arrays and Pandas DataFrames.",
      estimated_hours: 20,
      search_topics: ["numpy data analysis", "pandas dataframe", "python math"],
    },
    {
      order_index: 2,
      title: "Supervised Machine Learning Algorithms",
      description: "Train classification and regression models using Scikit-Learn (Linear Regression, Decision Trees, Random Forests).",
      estimated_hours: 25,
      search_topics: ["scikit learn machine learning", "supervised learning", "regression classification"],
    },
    {
      order_index: 3,
      title: "Deep Learning & Neural Networks with PyTorch",
      description: "Build and train multi-layer neural networks, loss functions, optimizers, and backpropagation in PyTorch.",
      estimated_hours: 30,
      search_topics: ["pytorch tutorial", "deep learning neural network", "pytorch tensors"],
    },
    {
      order_index: 4,
      title: "Transformers & Large Language Models (LLMs)",
      description: "Understand Transformer self-attention mechanisms, fine-tuning pre-trained models, and Hugging Face Transformers.",
      estimated_hours: 25,
      search_topics: ["transformers hugging face", "llm fine tuning", "deep learning ai"],
    },
  ],
  "data-science": [
    {
      order_index: 0,
      title: "Python & Data Analysis Foundations",
      description: "Master essential Python concepts and data processing libraries for data analytics.",
      estimated_hours: 15,
      search_topics: ["python data analysis", "pandas tutorial", "numpy data science"],
    },
    {
      order_index: 1,
      title: "SQL Data Extraction & Transformation",
      description: "Query complex relational datasets, perform aggregation, grouping, window functions, and data cleaning.",
      estimated_hours: 20,
      search_topics: ["sql data analytics", "postgresql query", "data extraction sql"],
    },
    {
      order_index: 2,
      title: "Exploratory Data Analysis & Visualization",
      description: "Visualize data trends and distributions using Matplotlib and Seaborn to gain actionable insights.",
      estimated_hours: 20,
      search_topics: ["exploratory data analysis", "data visualization matplotlib", "seaborn python"],
    },
    {
      order_index: 3,
      title: "Statistical Modeling & Predictive Analytics",
      description: "Apply hypothesis testing, probability distributions, correlation, and predictive machine learning models.",
      estimated_hours: 25,
      search_topics: ["applied statistics data science", "scikit learn prediction", "statistical modeling"],
    },
  ],
  "devops-cloud": [
    {
      order_index: 0,
      title: "Linux System Administration & Shell Scripting",
      description: "Learn Linux terminal commands, file permissions, process management, and automated Bash scripting.",
      estimated_hours: 18,
      search_topics: ["linux command line", "bash shell scripting", "linux administration"],
    },
    {
      order_index: 1,
      title: "Docker Containerization Essentials",
      description: "Package applications into container images using Dockerfiles and manage multi-container setups with Docker Compose.",
      estimated_hours: 20,
      search_topics: ["docker containers", "docker compose tutorial", "containerization devops"],
    },
    {
      order_index: 2,
      title: "Automated CI/CD Workflows",
      description: "Build automated test and deployment pipelines using GitHub Actions and continuous integration tools.",
      estimated_hours: 20,
      search_topics: ["github actions ci cd", "continuous integration devops", "pipeline automation"],
    },
    {
      order_index: 3,
      title: "Kubernetes Orchestration & Infrastructure as Code",
      description: "Manage container clusters at scale with Kubernetes and automate cloud infrastructure with Terraform.",
      estimated_hours: 25,
      search_topics: ["kubernetes orchestration", "terraform infrastructure code", "aws cloud devops"],
    },
  ],
};

export async function generateSkeleton(params: {
  fieldName: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  weeklyHours: number;
}): Promise<SkeletonStage[]> {
  try {
    const user = `Field: ${params.fieldName}
Learner level: ${params.skillLevel}
Weekly time available: ${params.weeklyHours} hours`;

    const result = await callForJson<{ stages: SkeletonStage[] }>({
      system: SYSTEM_PROMPT,
      user,
    });

    if (result && Array.isArray(result.stages) && result.stages.length > 0) {
      return result.stages;
    }
  } catch (err) {
    console.warn("[generateSkeleton AI fallback triggered]", err instanceof Error ? err.message : err);
  }

  // Fallback to field-tailored structured curriculum if AI model hits demand limits (503/429)
  const slugKey = params.fieldName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const fallback = FIELD_FALLBACK_SKELETONS[slugKey] || FIELD_FALLBACK_SKELETONS["backend-development"];

  return fallback;
}
