import { createServiceClient } from "@/lib/supabase/service";
import { getFieldBySlug } from "@/lib/fields/catalog";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardWorkspace, type DashboardPath } from "@/components/DashboardWorkspace";

type StoredStage = {
  id: string;
  title: string;
  order_index: number;
  estimated_hours: number;
  stage_progress: { status: string }[] | null;
};

type StoredPath = {
  id: string;
  skill_level: string;
  field_id: string | null;
  fields: { name: string; slug: string } | { name: string; slug: string }[] | null;
  stages: StoredStage[] | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/dashboard");

  const [profileResult, pathsResult] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("learning_paths").select(`
      id, field_id, skill_level, fields(name, slug),
      stages (id, title, order_index, estimated_hours, stage_progress (status))
    `).eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const storedPaths = (pathsResult.data ?? []) as StoredPath[];
  // Fetch only catalog entries referenced by this authenticated user's paths.
  const missingFieldIds = [...new Set(storedPaths.filter(path => {
    const field = Array.isArray(path.fields) ? path.fields[0] : path.fields;
    return !field?.name && path.field_id;
  }).map(path => path.field_id!))];
  const resolvedFields = new Map<string, string>();
  if (missingFieldIds.length) {
    const { data } = await createServiceClient().from("fields").select("id, name, slug").in("id", missingFieldIds);
    for (const field of data ?? []) resolvedFields.set(field.id, getFieldBySlug(field.slug)?.name || field.name);
  }
  const paths: DashboardPath[] = ((pathsResult.data ?? []) as StoredPath[]).map(path => ({
    id: path.id,
    name: resolvedFields.get(path.field_id ?? "") || (Array.isArray(path.fields) ? path.fields[0] : path.fields)?.name || "Your learning roadmap",
    level: path.skill_level,
    stages: [...(path.stages ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map(stage => ({
        id: stage.id,
        title: stage.title,
        hours: stage.estimated_hours,
        status: stage.stage_progress?.[0]?.status ?? "not_started",
      })),
  }));

  return <DashboardWorkspace
    name={profileResult.data?.display_name || user.email?.split("@")[0] || "learner"}
    paths={paths}
    loadError={Boolean(pathsResult.error)}
  />;
}
