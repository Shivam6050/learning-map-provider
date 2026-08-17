export type SeedResource = {
  title: string;
  url: string;
  platform: "youtube" | "udemy" | "mslearn" | "article" | "docs";
  resource_type: "video" | "course" | "article" | "docs";
  price: number;
  currency: string;
  topic_hints: string[];
};

export const BASE_SEED_RESOURCES: SeedResource[] = [
  {
    title: "HTTP - MDN Web Docs",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["http", "rest", "web fundamentals", "networking"],
  },
  {
    title: "REST API design — freeCodeCamp",
    url: "https://www.freecodecamp.org/news/rest-api-design-best-practices/",
    platform: "article",
    resource_type: "article",
    price: 0,
    currency: "USD",
    topic_hints: ["rest", "api design"],
  },
  {
    title: "Node.js Full Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["node", "javascript backend", "express"],
  },
  {
    title: "Express.js official documentation",
    url: "https://expressjs.com/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["express", "node", "framework"],
  },
  {
    title: "The Complete Node.js Developer Course — Udemy",
    url: "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/",
    platform: "udemy",
    resource_type: "course",
    price: 15,
    currency: "USD",
    topic_hints: ["node", "express", "framework", "backend fundamentals"],
  },
  {
    title: "PostgreSQL Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=qw--VYLpxG4",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["database", "sql", "postgresql"],
  },
  {
    title: "PostgreSQL & Database Bootcamp — Udemy",
    url: "https://www.udemy.com/course/the-complete-python-postgresql-developer-course/",
    platform: "udemy",
    resource_type: "course",
    price: 20,
    currency: "USD",
    topic_hints: ["database", "sql", "postgresql", "data modeling"],
  },
  {
    title: "Prisma ORM official documentation",
    url: "https://www.prisma.io/docs",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["database", "orm", "node"],
  },
  {
    title: "Authentication and Authorization — OWASP Cheat Sheet",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["auth", "security", "authentication"],
  },
  {
    title: "JWT Authentication Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=mbsmsi7l3r4",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["auth", "jwt", "security"],
  },
  {
    title: "Node.js, Express & MongoDB Bootcamp — Udemy",
    url: "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/",
    platform: "udemy",
    resource_type: "course",
    price: 25,
    currency: "USD",
    topic_hints: ["auth", "security", "jwt", "backend security"],
  },
  {
    title: "Testing Node.js Applications — Jest documentation",
    url: "https://jestjs.io/docs/getting-started",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["testing", "jest", "quality"],
  },
  {
    title: "Docker for Beginners — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=fqMOX6JJhGo",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["deployment", "docker", "devops"],
  },
  {
    title: "Docker & Kubernetes Mastery — Udemy",
    url: "https://www.udemy.com/course/docker-mastery/",
    platform: "udemy",
    resource_type: "course",
    price: 20,
    currency: "USD",
    topic_hints: ["deployment", "docker", "devops", "containerization"],
  },
  {
    title: "Deploying Node Apps — Render documentation",
    url: "https://render.com/docs/deploy-node-express-app",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["deployment", "hosting", "devops"],
  },
  {
    title: "System Design Primer",
    url: "https://github.com/donnemartin/system-design-primer",
    platform: "article",
    resource_type: "article",
    price: 0,
    currency: "USD",
    topic_hints: ["system design", "scalability", "architecture"],
  },
  {
    title: "Software Architecture & System Design — Udemy",
    url: "https://www.udemy.com/course/software-architecture-design-large-scale-systems/",
    platform: "udemy",
    resource_type: "course",
    price: 25,
    currency: "USD",
    topic_hints: ["system design", "scalability", "interviews"],
  },
];

export const BACKEND_DEV_RESOURCE_POOL = BASE_SEED_RESOURCES;

export function getAdjustedResourcePool(targetCurrency: string = "USD"): SeedResource[] {
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
    const convertedPrice = Math.round(res.price * rate);
    return {
      ...res,
      price: convertedPrice,
      currency: currencyUpper,
    };
  });
}
