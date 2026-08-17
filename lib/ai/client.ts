import Groq from "groq-sdk";

export const MODEL = "llama-3.3-70b-versatile";

const FALLBACK_SKELETON = [
  {
    order_index: 0,
    title: "HTTP & Web Fundamentals",
    description: "Learn basic HTTP methods, request headers, status codes, and foundational REST concepts.",
    estimated_hours: 10,
    search_topics: ["http", "rest", "web fundamentals"],
  },
  {
    order_index: 1,
    title: "Node.js & Express Basics",
    description: "Build server applications using Node.js runtime and Express framework routing.",
    estimated_hours: 15,
    search_topics: ["node", "express", "framework"],
  },
  {
    order_index: 2,
    title: "Database Modeling with PostgreSQL",
    description: "Design relational schemas, execute SQL queries, and integrate PostgreSQL with Prisma ORM.",
    estimated_hours: 20,
    search_topics: ["database", "sql", "postgresql"],
  },
  {
    order_index: 3,
    title: "Authentication & JWT Security",
    description: "Implement secure user authentication, password hashing, and JWT token sessions.",
    estimated_hours: 15,
    search_topics: ["auth", "jwt", "security"],
  },
  {
    order_index: 4,
    title: "Deployment & System Design",
    description: "Containerize applications using Docker, configure hosting on Render, and explore system scalability.",
    estimated_hours: 20,
    search_topics: ["deployment", "docker", "system design"],
  },
];

const FALLBACK_ASSEMBLED = [
  {
    order_index: 0,
    selected_resources: [
      { url: "https://developer.mozilla.org/en-US/docs/Web/HTTP", is_primary: true },
      { url: "https://www.freecodecamp.org/news/rest-api-design-best-practices/", is_primary: false },
    ],
    practice_check: "Build a simple HTTP server that handles GET and POST requests and returns JSON responses.",
  },
  {
    order_index: 1,
    selected_resources: [
      { url: "https://expressjs.com/", is_primary: true },
      { url: "https://www.youtube.com/watch?v=Oe421EPjeBE", is_primary: false },
    ],
    practice_check: "Create a RESTful API using Express with routes for CRUD operations.",
  },
  {
    order_index: 2,
    selected_resources: [
      { url: "https://www.youtube.com/watch?v=qw--VYLpxG4", is_primary: true },
      { url: "https://www.prisma.io/docs", is_primary: false },
    ],
    practice_check: "Connect your Express app to a PostgreSQL database using Prisma ORM.",
  },
  {
    order_index: 3,
    selected_resources: [
      { url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", is_primary: true },
      { url: "https://www.youtube.com/watch?v=mbsmsi7l3r4", is_primary: false },
    ],
    practice_check: "Add JWT authentication middleware to secure private API endpoints.",
  },
  {
    order_index: 4,
    selected_resources: [
      { url: "https://render.com/docs/deploy-node-express-app", is_primary: true },
      { url: "https://www.youtube.com/watch?v=fqMOX6JJhGo", is_primary: false },
    ],
    practice_check: "Containerize your Node.js application using Docker and deploy it to a live cloud platform.",
  },
];

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim() || "gsk_placeholder";
  return new Groq({ apiKey });
}

/**
 * Calls Groq with a system prompt that demands JSON-only output, and
 * parses the result defensively. If GROQ_API_KEY is unconfigured or a placeholder,
 * returns fallback seed data so path generation can be tested without an API key.
 */
export async function callForJson<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  // Fallback demo mode if GROQ_API_KEY is not configured or is a placeholder
  if (!apiKey || apiKey.includes("your-groq")) {
    if (params.system.includes("curriculum designer")) {
      return { stages: FALLBACK_SKELETON } as unknown as T;
    }
    return { stages: FALLBACK_ASSEMBLED } as unknown as T;
  }

  const groq = new Groq({ apiKey });

  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 2000,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No text content in Groq response");
  }

  const cleaned = content.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from Groq response: ${cleaned.slice(0, 200)}`
    );
  }
}
