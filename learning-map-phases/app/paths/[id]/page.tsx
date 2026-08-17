import { createClient } from "@/lib/supabase/server";
import { inMemoryPaths } from "@/lib/db/in-memory-paths";

export default async function PathPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let path: any = null;
  let stages: any[] = [];

  try {
    const { data: dbPath } = await supabase
      .from("learning_paths")
      .select("id, skill_level, weekly_hours, budget_total, currency, fields(name)")
      .eq("id", id)
      .maybeSingle();

    if (dbPath) {
      path = dbPath;
      const { data: dbStages } = await supabase
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

      if (dbStages && dbStages.length) {
        stages = dbStages;
      }
    }
  } catch {
    // Database query error or unconfigured DB
  }

  // Fallback to inMemoryPaths if not in database
  if (!path || !stages.length) {
    const stored = inMemoryPaths.get(id);
    if (stored) {
      path = {
        id: stored.id,
        skill_level: stored.skill_level,
        weekly_hours: stored.weekly_hours,
        budget_total: stored.budget_total,
        currency: stored.currency,
        fields: { name: stored.field_name },
      };
      stages = stored.stages;
    }
  }

  // Default fallback if path ID is entirely unknown
  if (!path) {
    path = {
      id,
      skill_level: "beginner",
      weekly_hours: 5,
      budget_total: 0,
      currency: "USD",
      fields: { name: "Backend Development" },
    };
  }

  if (!stages.length) {
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
    ];
  }

  const field = Array.isArray(path.fields) ? path.fields[0] : path.fields;

  // Calculate total cost of selected paid resources in the path
  let totalCost = 0;
  stages.forEach((stage: any) => {
    stage.stage_resources?.forEach((sr: any) => {
      const res = Array.isArray(sr.resources) ? sr.resources[0] : sr.resources;
      if (res?.price && res.price > 0) {
        totalCost += Number(res.price);
      }
    });
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-indigo-600">{field?.name}</p>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 capitalize">
          {path.skill_level} level
        </span>
      </div>

      <h1 className="mt-2 font-serif text-3xl font-bold text-slate-900">Your Learning Path</h1>

      <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Weekly Hours</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{path.weekly_hours} hrs/week</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Your Budget</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {path.budget_total} {path.currency}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Path Est. Cost</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">
            {totalCost > 0 ? `${totalCost} ${path.currency}` : "Free ($0)"}
          </p>
        </div>
      </div>

      <ol className="mt-8 space-y-6">
        {stages.map((stage: any) => (
          <li key={stage.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-slate-900">
                {stage.order_index + 1}. {stage.title}
              </h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500 font-medium">
                ~{stage.estimated_hours}h
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{stage.description}</p>

            {stage.stage_resources?.length ? (
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                {stage.stage_resources
                  .sort((a: any, b: any) => a.order_index - b.order_index)
                  .map((sr: any, i: number) => {
                    const resource = Array.isArray(sr.resources)
                      ? sr.resources[0]
                      : sr.resources;
                    if (!resource) return null;
                    return (
                      <li key={i} className="flex items-center justify-between gap-2 text-sm py-1">
                        <div className="flex items-center gap-2">
                          {sr.is_primary && (
                            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-indigo-800">
                              Primary
                            </span>
                          )}
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            {resource.title}
                          </a>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
                          {resource.platform} ·{" "}
                          {resource.price > 0
                            ? `${resource.price} ${resource.currency}`
                            : "Free"}
                        </span>
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
              <div className="mt-4 rounded-lg bg-amber-50/70 border border-amber-200/60 p-3 text-xs text-amber-900">
                <span className="font-semibold text-amber-800">Practice check: </span>
                {(stage.stage_progress[0].practice_check as { description: string })
                  .description}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
