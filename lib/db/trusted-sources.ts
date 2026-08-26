import { createServiceClient } from "@/lib/supabase/service";

/**
 * Finds or proposes a trusted_sources row for a given publisher
 * (YouTube channel or web domain), scoped to a field. Newly proposed
 * sources are inserted with approved=false, added_by='ai_proposed' —
 * an admin has to approve them (see app/admin/trusted-sources) before
 * resources linked to them count as trusted in judgment.
 *
 * This is what makes the roadmap's Phase 5 exit check real: a source
 * discovered without any manual SQL can enter the system and
 * eventually get used in a real path, once approved.
 */
export async function findOrProposeTrustedSource(params: {
  fieldId: string;
  sourceName: string;
  sourceUrl: string;
  platform: string;
}): Promise<{ id: string; approved: boolean }> {
  const service = createServiceClient();

  const { data: existing } = await service
    .from("trusted_sources")
    .select("id, approved")
    .eq("field_id", params.fieldId)
    .eq("source_name", params.sourceName)
    .eq("platform", params.platform)
    .maybeSingle();

  if (existing) return existing;

  const { data: inserted, error } = await service
    .from("trusted_sources")
    .insert({
      field_id: params.fieldId,
      source_name: params.sourceName,
      source_url: params.sourceUrl,
      platform: params.platform,
      added_by: "ai_proposed",
      approved: false,
    })
    .select("id, approved")
    .single();

  // Don't let a failure here break discovery — an unproposed source
  // just means the resource stays ungrouped, not that it disappears.
  if (error || !inserted) return { id: "", approved: false };
  return inserted;
}
