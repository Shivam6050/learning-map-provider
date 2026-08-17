export const GEMINI_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
];

export const MODEL = GEMINI_MODEL_CANDIDATES[0];

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

async function callGeminiForJson<T>(
  apiKey: string,
  params: { system: string; user: string }
): Promise<T | null> {
  for (const model of GEMINI_MODEL_CANDIDATES) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: params.system }] },
            contents: [{ parts: [{ text: params.user }] }],
            generationConfig: {
              response_mime_type: "application/json",
            },
          }),
        }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned) as T;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Calls Google Gemini API using GEMINI_API_KEY with JSON mode.
 * Parses structured output defensively and falls back smoothly if key is missing or unconfigured.
 */
export async function callForJson<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (
    geminiKey &&
    !geminiKey.includes("your-gemini") &&
    geminiKey !== "your-groq-api-key" &&
    geminiKey !== "gsk_placeholder"
  ) {
    const geminiResult = await callGeminiForJson<T>(geminiKey, params);
    if (geminiResult) return geminiResult;
  }

  // Fallback demo mode if GEMINI_API_KEY is missing or unconfigured
  if (params.system.includes("curriculum designer")) {
    return { stages: FALLBACK_SKELETON } as unknown as T;
  }
  return { stages: FALLBACK_ASSEMBLED } as unknown as T;
}
