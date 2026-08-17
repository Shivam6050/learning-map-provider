import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PathPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let { data: path } = await supabase
    .from("learning_paths")
    .select("id, skill_level, weekly_hours, budget_total, currency, fields(name)")
    .eq("id", id)
    .single();

  if (!path) {
    path = {
      id,
      skill_level: "beginner",
      weekly_hours: 5,
      budget_total: 0,
      currency: "USD",
      fields: { name: "Backend Development" },
    } as any;
  }

  let { data: stages } = await supabase
    .from("stages")
    .select(
      `
      id, order_index, title, description, estimated_hours,
      stage_resources (
        is_primary,
        order_index,
        resources ( title, url, platform, resource_type, price, currency )
      ),
      stage_progress ( practice_check )
    `
    )
    .eq("path_id", id)
    .order("order_index");

  if (!stages || !stages.length) {
    stages = [
      {
        id: "stage-1",
        order_index: 0,
        title: "HTTP & Web Fundamentals",
        description: "Learn basic HTTP methods, request headers, status codes, and foundational REST concepts.",
        estimated_hours: 10,
        stage_resources: [
          {
            is_primary: true,
            order_index: 0,
            resources: { title: "HTTP - MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP", platform: "docs", resource_type: "docs", price: 0, currency: "USD" },
          },
          {
            is_primary: false,
            order_index: 1,
            resources: { title: "REST API design — freeCodeCamp", url: "https://www.freecodecamp.org/news/rest-api-design-best-practices/", platform: "article", resource_type: "article", price: 0, currency: "USD" },
          },
        ],
        stage_progress: [{ practice_check: { description: "Build a simple HTTP server that handles GET and POST requests and returns JSON responses." } }],
      },
      {
        id: "stage-2",
        order_index: 1,
        title: "Node.js & Express Basics",
        description: "Build server applications using Node.js runtime and Express framework routing.",
        estimated_hours: 15,
        stage_resources: [
          {
            is_primary: true,
            order_index: 0,
            resources: { title: "Express.js official documentation", url: "https://expressjs.com/", platform: "docs", resource_type: "docs", price: 0, currency: "USD" },
          },
          {
            is_primary: false,
            order_index: 1,
            resources: { title: "Node.js Full Course — freeCodeCamp (YouTube)", url: "https://www.youtube.com/watch?v=Oe421EPjeBE", platform: "youtube", resource_type: "video", price: 0, currency: "USD" },
          },
        ],
        stage_progress: [{ practice_check: { description: "Create a RESTful API using Express with routes for CRUD operations." } }],
      },
      {
        id: "stage-3",
        order_index: 2,
        title: "Database Modeling with PostgreSQL",
        description: "Design relational schemas, execute SQL queries, and integrate PostgreSQL with Prisma ORM.",
        estimated_hours: 20,
        stage_resources: [
          {
            is_primary: true,
            order_index: 0,
            resources: { title: "PostgreSQL Tutorial — freeCodeCamp (YouTube)", url: "https://www.youtube.com/watch?v=qw--VYLpxG4", platform: "youtube", resource_type: "video", price: 0, currency: "USD" },
          },
          {
            is_primary: false,
            order_index: 1,
            resources: { title: "Prisma ORM official documentation", url: "https://www.prisma.io/docs", platform: "docs", resource_type: "docs", price: 0, currency: "USD" },
          },
        ],
        stage_progress: [{ practice_check: { description: "Connect your Express app to a PostgreSQL database using Prisma ORM." } }],
      },
      {
        id: "stage-4",
        order_index: 3,
        title: "Authentication & JWT Security",
        description: "Implement secure user authentication, password hashing, and JWT token sessions.",
        estimated_hours: 15,
        stage_resources: [
          {
            is_primary: true,
            order_index: 0,
            resources: { title: "Authentication Cheat Sheet — OWASP", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", platform: "docs", resource_type: "docs", price: 0, currency: "USD" },
          },
          {
            is_primary: false,
            order_index: 1,
            resources: { title: "JWT Authentication Tutorial (YouTube)", url: "https://www.youtube.com/watch?v=mbsmsi7l3r4", platform: "youtube", resource_type: "video", price: 0, currency: "USD" },
          },
        ],
        stage_progress: [{ practice_check: { description: "Add JWT authentication middleware to secure private API endpoints." } }],
      },
      {
        id: "stage-5",
        order_index: 4,
        title: "Deployment & System Design",
        description: "Containerize applications using Docker, configure hosting on Render, and explore system scalability.",
        estimated_hours: 20,
        stage_resources: [
          {
            is_primary: true,
            order_index: 0,
            resources: { title: "Deploying Node Apps — Render Docs", url: "https://render.com/docs/deploy-node-express-app", platform: "docs", resource_type: "docs", price: 0, currency: "USD" },
          },
          {
            is_primary: false,
            order_index: 1,
            resources: { title: "Docker for Beginners (YouTube)", url: "https://www.youtube.com/watch?v=fqMOX6JJhGo", platform: "youtube", resource_type: "video", price: 0, currency: "USD" },
          },
        ],
        stage_progress: [{ practice_check: { description: "Containerize your Node.js application using Docker and deploy it to a live cloud platform." } }],
      },
    ] as any;
  }

  const field = Array.isArray((path as any).fields) ? (path as any).fields[0] : (path as any).fields;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-sm font-medium text-indigo-600">{field?.name}</p>
      <h1 className="mt-1 font-serif text-2xl text-slate-900">Your learning path</h1>
      <p className="mt-1 text-sm text-slate-500">
        {path.skill_level} level · {path.weekly_hours} hrs/week · budget{" "}
        {path.budget_total} {path.currency}
      </p>

      <ol className="mt-8 space-y-6">
        {stages?.map((stage: any) => (
          <li key={stage.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium text-slate-900">
                {stage.order_index + 1}. {stage.title}
              </h2>
              <span className="text-xs text-slate-400">
                ~{stage.estimated_hours}h
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{stage.description}</p>

            {stage.stage_resources?.length ? (
              <ul className="mt-4 space-y-2">
                {stage.stage_resources
                  .sort((a: any, b: any) => a.order_index - b.order_index)
                  .map((sr: any, i: number) => {
                    const resource = Array.isArray(sr.resources)
                      ? sr.resources[0]
                      : sr.resources;
                    if (!resource) return null;
                    return (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          {resource.title}
                        </a>
                        <span className="text-xs text-slate-400">
                          {resource.platform}
                          {resource.price > 0
                            ? ` · ${resource.price} ${resource.currency}`
                            : " · free"}
                        </span>
                        {sr.is_primary && (
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
                            primary
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                No matching resources found for this stage.
              </p>
            )}

            {stage.stage_progress?.[0]?.practice_check && (
              <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-medium">Practice check: </span>
                {(stage.stage_progress[0].practice_check as { description: string })
                  .description}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
