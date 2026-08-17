import { createServiceClient } from "@/lib/supabase/service";
import { BACKEND_DEV_RESOURCE_POOL, type SeedResource } from "@/lib/ai/seed-resources";

export const BACKEND_DEV_FIELD_SLUG = "backend-development";

/**
 * Ensures the "Backend Development" field row exists. Phase 1 hardcodes
 * this one field per the roadmap — a field picker comes in Phase 6.
 */
export async function ensureBackendDevField(): Promise<string> {
  const service = createServiceClient();

  try {
    const { data: existing } = await service
      .from("fields")
      .select("id")
      .eq("slug", BACKEND_DEV_FIELD_SLUG)
      .maybeSingle();

    if (existing?.id) return existing.id;

    const { data, error } = await service
      .from("fields")
      .insert({ name: "Backend Development", slug: BACKEND_DEV_FIELD_SLUG })
      .select("id")
      .single();

    if (data?.id) return data.id;
  } catch {
    // Fallback if Supabase service role client is unconfigured or in demo mode
  }

  return "00000000-0000-0000-0000-000000000001";
}

/**
 * Upserts the hand-seeded resource pool into the resources table (by
 * unique url) and returns a map from url -> resources.id, so the caller
 * can translate the AI's chosen URLs into foreign keys for
 * stage_resources. Written via the service-role client because
 * `resources` has no client-facing write policy — see schema.sql.
 */
export async function ensureSeedResources(): Promise<Map<string, string>> {
  const service = createServiceClient();
  const urlToId = new Map<string, string>();

  for (const resource of BACKEND_DEV_RESOURCE_POOL) {
    try {
      const { data: existing } = await service
        .from("resources")
        .select("id")
        .eq("url", resource.url)
        .maybeSingle();

      if (existing?.id) {
        urlToId.set(resource.url, existing.id);
        continue;
      }

      const { data } = await service
        .from("resources")
        .insert({
          title: resource.title,
          url: resource.url,
          platform: resource.platform,
          resource_type: resource.resource_type,
          price: resource.price,
          currency: resource.currency,
          // Hand-picked by the founder for Phase 1 — see the caveat in
          // seed-resources.ts. Real allowlisting logic arrives in Phase 5.
          trust_status: "allowlisted",
        })
        .select("id")
        .single();

      if (data?.id) {
        urlToId.set(resource.url, data.id);
        continue;
      }
    } catch {
      // Fallback
    }

    urlToId.set(resource.url, `res-${Math.random().toString(36).substring(2, 9)}`);
  }

  return urlToId;
}

export function getSeedResourcePool(): SeedResource[] {
  return BACKEND_DEV_RESOURCE_POOL;
}
