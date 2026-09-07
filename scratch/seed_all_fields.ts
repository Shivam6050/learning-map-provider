import { createServiceClient } from "../lib/supabase/service";
import { FIELD_CATALOG } from "../lib/fields/catalog";

async function seedFields() {
  const service = createServiceClient();
  for (const f of FIELD_CATALOG) {
    const { data: existing } = await service.from("fields").select("id").eq("slug", f.slug).maybeSingle();
    if (!existing) {
      const { data, error } = await service.from("fields").insert({ name: f.name, slug: f.slug }).select();
      console.log("Inserted field:", f.slug, data, error);
    } else {
      console.log("Field exists:", f.slug, existing.id);
    }
  }

  const { data: allFields } = await service.from("fields").select("*");
  console.log("All fields in DB:", allFields);
}

seedFields();
