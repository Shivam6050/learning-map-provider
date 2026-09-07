import { getFieldBySlug } from "../lib/fields/catalog";

const testSlugs = ["ai-machine-learning", "frontend-development", "data-science", "devops-cloud", "full-stack-development", "backend-development"];

for (const slug of testSlugs) {
  const field = getFieldBySlug(slug);
  console.log(`Slug "${slug}" resolves field_name to: "${field?.name}"`);
}
