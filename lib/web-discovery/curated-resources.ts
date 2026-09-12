import type { SeedResource } from "@/lib/ai/seed-resources";

// Exact free learning pages; paid certificates, subscriptions and upgrades are excluded.
// Availability is still checked by prepareCandidates before a path is offered.
export const CURATED_LEARNING_RESOURCES: SeedResource[] = [
{"title":"Learn Node.js — Scrimba","url":"https://scrimba.com/learn-nodejs-c00ho9qqh6","topic_hints":["node.js","nodejs","node","backend javascript","event loop"],"platform":"article","resource_type":"course","price":0,"currency":"USD"},
{"title":"Learn Express.js — Scrimba","url":"https://scrimba.com/learn-expressjs-c062las154","topic_hints":["express","expressjs","express.js","node rest api"],"platform":"article","resource_type":"course","price":0,"currency":"USD"},
{"title":"Learn SQL — Scrimba","url":"https://scrimba.com/learn-sql-c0aviq0aha","topic_hints":["sql","postgresql","database queries","joins"],"platform":"article","resource_type":"course","price":0,"currency":"USD"},
{"title":"Learn TypeScript — Scrimba","url":"https://scrimba.com/learn-typescript-c03c","topic_hints":["typescript"],"platform":"article","resource_type":"course","price":0,"currency":"USD"},
{"title":"Learn Next.js — Scrimba","url":"https://scrimba.com/learn-nextjs-c02moisq6a","topic_hints":["nextjs","next.js"],"platform":"article","resource_type":"course","price":0,"currency":"USD"},
{"title":"Intro to Supabase — Scrimba","url":"https://scrimba.com/intro-to-supabase-c0abltfqed","topic_hints":["supabase"],"platform":"article","resource_type":"course","price":0,"currency":"USD"},
  {
    "title": "Learn HTML and CSS — Scrimba",
    "url": "https://scrimba.com/learn-html-and-css-c0p",
    "platform": "article",
    "resource_type": "course",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "html",
      "css",
      "responsive web design",
      "web fundamentals"
    ]
  },
  {
    "title": "Learn JavaScript — Scrimba",
    "url": "https://scrimba.com/learn-javascript-c0v",
    "platform": "article",
    "resource_type": "course",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "javascript",
      "js",
      "dom",
      "es6"
    ]
  },
  {
    "title": "Learn React — Scrimba",
    "url": "https://scrimba.com/learn-react-c0e",
    "platform": "article",
    "resource_type": "course",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "react",
      "jsx",
      "react hooks"
    ]
  },
  {
    "title": "JavaScript Tutorial — GeeksforGeeks",
    "url": "https://www.geeksforgeeks.org/javascript/javascript-tutorial/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "javascript",
      "js",
      "dom",
      "es6"
    ]
  },
  {
    "title": "Python Tutorial — GeeksforGeeks",
    "url": "https://www.geeksforgeeks.org/python/python-programming-language-tutorial/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "python"
    ]
  },
  {
    "title": "HTML Tutorial — W3Schools",
    "url": "https://www.w3schools.com/html/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "html",
      "web fundamentals"
    ]
  },
  {
    "title": "CSS Tutorial — W3Schools",
    "url": "https://www.w3schools.com/css/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "css",
      "responsive web design",
      "flexbox",
      "grid"
    ]
  },
  {
    "title": "JavaScript Tutorial — W3Schools",
    "url": "https://www.w3schools.com/js/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "javascript",
      "js",
      "dom",
      "es6"
    ]
  },
  {
    "title": "React Tutorial — W3Schools",
    "url": "https://www.w3schools.com/react/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "react",
      "jsx",
      "react hooks"
    ]
  },
  {
    "title": "Python Tutorial — W3Schools",
    "url": "https://www.w3schools.com/python/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "python"
    ]
  },
  {
    "title": "SQL Tutorial — W3Schools",
    "url": "https://www.w3schools.com/sql/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "sql",
      "database queries"
    ]
  },
  {
    "title": "TypeScript Tutorial — W3Schools",
    "url": "https://www.w3schools.com/typescript/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "typescript"
    ]
  },
  {
    "title": "Git Tutorial — W3Schools",
    "url": "https://www.w3schools.com/git/",
    "platform": "docs",
    "resource_type": "docs",
    "price": 0,
    "currency": "USD",
    "topic_hints": [
      "git",
      "version control"
    ]
  }
];

export function curatedLearningResource(url: string): SeedResource | undefined {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return undefined;
    return CURATED_LEARNING_RESOURCES.find(resource => {
      const known = new URL(resource.url);
      return parsed.hostname.replace(/^www\./, '') === known.hostname.replace(/^www\./, '') &&
        parsed.pathname.replace(/\/$/, '') === known.pathname.replace(/\/$/, '');
    });
  } catch { return undefined; }
}
