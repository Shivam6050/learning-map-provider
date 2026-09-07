import { createServiceClient } from "../lib/supabase/service";

async function checkFields() {
  const service = createServiceClient();
  const { data: fields, error } = await service.from("fields").select("*");
  console.log("Fields in database:", fields);
  console.log("Error if any:", error);
}

checkFields();
