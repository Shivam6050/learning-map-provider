import { createServiceClient } from "@/lib/supabase/service";
import type { DiscoveredResource } from "@/lib/youtube/discover";

export type SeedResource = {
  title: string;
  url: string;
  platform: "youtube" | "udemy" | "coursera" | "mslearn" | "article" | "docs";
  resource_type: "video" | "course" | "article" | "docs";
  price: number;
  currency: string;
  topic_hints: string[];
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
    topic_hints: ["http", "rest", "web fundamentals", "networking", "backend"],
  },
  {
    title: "REST API design — freeCodeCamp",
    url: "https://www.freecodecamp.org/news/rest-api-design-best-practices/",
    platform: "article",
    resource_type: "article",
    price: 0,
    currency: "USD",
    topic_hints: ["rest", "api design", "backend"],
  },
  {
    title: "Node.js Full Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=Oe421EPjeBE",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["node", "javascript backend", "express", "backend"],
  },
  {
    title: "Express.js official documentation",
    url: "https://expressjs.com/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["express", "node", "framework", "backend"],
  },
  {
    title: "The Complete Node.js Developer Course — Udemy",
    url: "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/",
    platform: "udemy",
    resource_type: "course",
    price: 25,
    currency: "USD",
    topic_hints: ["node", "express", "framework", "backend fundamentals", "backend"],
  },
  {
    title: "PostgreSQL Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=qw--VYLpxG4",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["database", "sql", "postgresql", "backend"],
  },
  {
    title: "PostgreSQL & Database Bootcamp — Udemy",
    url: "https://www.udemy.com/course/the-complete-python-postgresql-developer-course/",
    platform: "udemy",
    resource_type: "course",
    price: 30,
    currency: "USD",
    topic_hints: ["database", "sql", "postgresql", "data modeling", "backend"],
  },
  {
    title: "JWT Authentication Tutorial — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=mbsmsi7l3r4",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["auth", "jwt", "security", "backend"],
  },

  // --- FRONTEND DEVELOPMENT ---
  {
    title: "HTML & CSS Crash Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=mU6anWqZJcc",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["html", "css", "web", "frontend", "markup"],
  },
  {
    title: "JavaScript Complete Course — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=jS4aFq5-91M",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["javascript", "js", "frontend", "es6"],
  },
  {
    title: "React Official Documentation",
    url: "https://react.dev/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["react", "frontend", "ui", "components"],
  },
  {
    title: "The Complete React Developer Course — Udemy",
    url: "https://www.udemy.com/course/react-2nd-edition/",
    platform: "udemy",
    resource_type: "course",
    price: 25,
    currency: "USD",
    topic_hints: ["react", "redux", "frontend", "hooks"],
  },
  {
    title: "Next.js & React - The Complete Guide — Udemy",
    url: "https://www.udemy.com/course/nextjs-react-the-complete-guide/",
    platform: "udemy",
    resource_type: "course",
    price: 35,
    currency: "USD",
    topic_hints: ["next.js", "nextjs", "react", "frontend", "ssr"],
  },
  {
    title: "TypeScript Handbook — Official Docs",
    url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["typescript", "ts", "frontend"],
  },

  // --- FULL-STACK DEVELOPMENT ---
  {
    title: "Full Stack Web Development — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=nu_pCVPKzTk",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["full stack", "fullstack", "mern", "web development"],
  },
  {
    title: "The Complete Web Development Bootcamp — Udemy",
    url: "https://www.udemy.com/course/the-complete-web-development-bootcamp/",
    platform: "udemy",
    resource_type: "course",
    price: 40,
    currency: "USD",
    topic_hints: ["full stack", "fullstack", "react", "node", "web development"],
  },
  {
    title: "MERN Stack Front to Back — Udemy",
    url: "https://www.udemy.com/course/mern-stack-front-to-back/",
    platform: "udemy",
    resource_type: "course",
    price: 30,
    currency: "USD",
    topic_hints: ["full stack", "mern", "mongodb", "express", "react", "node"],
  },

  // --- AI & MACHINE LEARNING ---
  {
    title: "Python for Beginners — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["python", "ai", "machine learning"],
  },
  {
    title: "Machine Learning Specialization — Coursera / DeepLearning.AI",
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    platform: "coursera",
    resource_type: "course",
    price: 49,
    currency: "USD",
    topic_hints: ["machine learning", "ml", "ai", "neural networks", "andrew ng"],
  },
  {
    title: "PyTorch Official Tutorials & Docs",
    url: "https://pytorch.org/tutorials/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["pytorch", "deep learning", "ai", "tensors"],
  },
  {
    title: "Deep Learning Specialization — Coursera",
    url: "https://www.coursera.org/specializations/deep-learning",
    platform: "coursera",
    resource_type: "course",
    price: 49,
    currency: "USD",
    topic_hints: ["deep learning", "ai", "transformers", "cnn", "rnn"],
  },

  // --- DATA SCIENCE ---
  {
    title: "Data Analysis with Python — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=r-uOLxNrNk8",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["data science", "pandas", "numpy", "eda", "analytics"],
  },
  {
    title: "Pandas & NumPy Official Documentation",
    url: "https://pandas.pydata.org/docs/",
    platform: "docs",
    resource_type: "docs",
    price: 0,
    currency: "USD",
    topic_hints: ["pandas", "numpy", "data science"],
  },
  {
    title: "Python for Data Science Bootcamp — Udemy",
    url: "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/",
    platform: "udemy",
    resource_type: "course",
    price: 30,
    currency: "USD",
    topic_hints: ["data science", "python", "data analysis", "visualization"],
  },

  // --- DEVOPS & CLOUD ---
  {
    title: "Docker for Beginners — freeCodeCamp (YouTube)",
    url: "https://www.youtube.com/watch?v=fqMOX6JJhGo",
    platform: "youtube",
    resource_type: "video",
    price: 0,
    currency: "USD",
    topic_hints: ["docker", "devops", "containers"],
  },
  {
    title: "Docker & Kubernetes Mastery — Udemy",
    url: "https://www.udemy.com/course/docker-mastery/",
    platform: "udemy",
    resource_type: "course",
    price: 35,
    currency: "USD",
    topic_hints: ["docker", "kubernetes", "devops", "containers"],
  },
  {
    title: "AWS Certified Solutions Architect Associate — Udemy",
    url: "https://www.udemy.com/course/aws-certified-solutions-architect-associate-amazon-practice-exams/",
    platform: "udemy",
    resource_type: "course",
    price: 39,
    currency: "USD",
    topic_hints: ["aws", "cloud", "devops", "infrastructure"],
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

    if (userBudget > 0) {
      if (currencyUpper === "INR") {
        price = Math.round(Math.min(res.price * 80, userBudget * 0.4));
        price = Math.max(299, price);
      } else if (currencyUpper === "USD") {
        price = Math.round(Math.min(res.price, userBudget * 0.4));
        price = Math.max(5, price);
      } else if (currencyUpper === "EUR") {
        price = Math.round(Math.min(res.price * 0.92, userBudget * 0.4));
        price = Math.max(5, price);
      }
    }

    return {
      ...res,
      price,
      currency: currencyUpper,
    };
  });
}

export async function ensureSeedCandidates(
  topics: string[],
  currency: string,
  budgetTotal: number
): Promise<DiscoveredResource[]> {
  const pool = getAdjustedResourcePool(currency, budgetTotal);
  const normalizedTopics = topics.map((t) => t.toLowerCase());

  let matched = pool.filter((res) => {
    return res.topic_hints.some((hint) =>
      normalizedTopics.some((t) => t.includes(hint) || hint.includes(t))
    );
  });

  if (matched.length === 0) {
    matched = pool.slice(0, 5);
  }

  const service = createServiceClient();
  const results: DiscoveredResource[] = [];

  for (const seed of matched) {
    try {
      const { data: existing } = await service
        .from("resources")
        .select("id, title, url, platform, resource_type, price, currency, rating, link_status")
        .eq("url", seed.url)
        .maybeSingle();

      if (existing) {
        await service
          .from("resources")
          .update({ price: seed.price, currency: seed.currency })
          .eq("id", existing.id);

        results.push({
          id: existing.id,
          title: existing.title,
          url: existing.url,
          platform: existing.platform,
          resource_type: existing.resource_type,
          price: seed.price,
          currency: seed.currency,
          signals: {},
          trust_status: "allowlisted",
          rating: existing.rating,
          link_status: existing.link_status || "ok",
        });
      } else {
        const { data: inserted } = await service
          .from("resources")
          .insert({
            title: seed.title,
            url: seed.url,
            platform: seed.platform,
            resource_type: seed.resource_type,
            price: seed.price,
            currency: seed.currency,
            trust_status: "allowlisted",
            signals: {},
            link_status: "ok",
          })
          .select("id")
          .single();

        if (inserted) {
          results.push({
            id: inserted.id,
            title: seed.title,
            url: seed.url,
            platform: seed.platform,
            resource_type: seed.resource_type,
            price: seed.price,
            currency: seed.currency,
            signals: {},
            trust_status: "allowlisted",
            rating: null,
            link_status: "ok",
          });
        }
      }
    } catch (e) {
      console.error("[ensureSeedCandidates]", e);
    }
  }

  return results;
}
