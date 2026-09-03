import { createServiceClient } from "@/lib/supabase/service";
import { BACKEND_DEV_RESOURCE_POOL, type SeedResource } from "@/lib/ai/seed-resources";

export const BACKEND_DEV_FIELD_SLUG = "backend-development";

/**
 * Ensures a field row exists for the given catalog entry (see
 * lib/fields/catalog.ts). Generalized from the old
 * ensureBackendDevField — the pipeline was already field-agnostic
 * everywhere except this one hardcoded lookup. Throws on failure
 * rather than returning a fake UUID: a fabricated field_id would fail
 * the learning_paths.field_id foreign key anyway, just less clearly.
 */
export async function ensureField(name: string, slug: string): Promise<string> {
  const service = createServiceClient();

  const { data: existing, error: selectError } = await service
    .from("fields")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (selectError) throw new Error(`Failed to look up field: ${selectError.message}`);
  if (existing?.id) return existing.id;

  const { data, error } = await service
    .from("fields")
    .insert({ name, slug })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Failed to seed field: ${error?.message}`);
  return data.id;
}

/**
 * Upserts the Phase 1 static resource pool. No longer called by the
 * live path-generation flow (real discovery now inserts resources
 * directly with real UUIDs at discovery time) — kept for local
 * dev/testing without API keys configured, e.g. seeding demo data.
 */
export async function ensureSeedResources(): Promise<Map<string, string>> {
  const service = createServiceClient();
  const urlToId = new Map<string, string>();

  for (const resource of BACKEND_DEV_RESOURCE_POOL) {
    const { data: existing, error: selectError } = await service
      .from("resources")
      .select("id")
      .eq("url", resource.url)
      .maybeSingle();

    if (selectError) throw new Error(`Failed to look up resource: ${selectError.message}`);
    if (existing?.id) {
      urlToId.set(resource.url, existing.id);
      continue;
    }

    const { data, error } = await service
      .from("resources")
      .insert({
        title: resource.title,
        url: resource.url,
        platform: resource.platform,
        resource_type: resource.resource_type,
        price: resource.price,
        currency: resource.currency,
        trust_status: "allowlisted",
      })
      .select("id")
      .single();

    if (error || !data) throw new Error(`Failed to seed resource ${resource.url}: ${error?.message}`);
    urlToId.set(resource.url, data.id);
  }

  return urlToId;
}

export function getSeedResourcePool(): SeedResource[] {
  return BACKEND_DEV_RESOURCE_POOL;
}
