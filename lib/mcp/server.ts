import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { CATALOG_NOTICE, LEVELS, publicCatalog, publicResources, publicRoadmap } from "./catalog";
import { FIELD_CATALOG } from "@/lib/fields/catalog";

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const result = (value: Record<string, unknown>) => ({ content: [{type: "text" as const, text: JSON.stringify(value)}], structuredContent: value });
export function createLearningMapServer() {
  const server = new McpServer({ name: "learningmap", version: "1.0.0" }, { instructions: "Public LearningMap catalog only. Never claim access to personal accounts, saved paths, progress, or live regional prices. " + CATALOG_NOTICE });
  server.registerTool("list_learning_fields", {
    description: "List the supported LearningMap fields and experience levels.", inputSchema: z.object({}).strict(), annotations,
  }, async () => result({ fields: FIELD_CATALOG.map(({slug,name}) => ({slug,name})), levels: LEVELS }));
  server.registerTool("get_curriculum_preview", {
    description: "Read an authored learning outline for a field and level, including projects, estimated effort and curated free resource references. Does not generate or save a personal roadmap.",
    inputSchema: z.object({ field: z.enum(FIELD_CATALOG.map(field => field.slug) as [string,...string[]]), level: z.enum(LEVELS) }).strict(), annotations,
  }, async ({field,level}) => result(publicRoadmap(field,level)!));
  server.registerTool("search_learning_resources", {
    description: "Search curated resources by title or topic. Free access is a catalog classification, not a live price guarantee; verify current provider terms.",
    inputSchema: z.object({ query: z.string().trim().min(2).max(100), limit: z.number().int().min(1).max(20).default(10) }).strict(), annotations,
  }, async ({query,limit}) => {
    const words = query.toLowerCase().split(/\s+/);
    const matches = publicResources.filter(resource => words.every(word => (resource.title + " " + resource.topics.join(" ")).toLowerCase().includes(word)));
    return result({ notice: CATALOG_NOTICE, total: matches.length, resources: matches.slice(0,limit) });
  });
  server.registerResource("learning-catalog", "learningmap://catalog", {title: "LearningMap public catalog", mimeType: "application/json", description: CATALOG_NOTICE}, async uri => ({contents: [{uri: uri.href, mimeType: "application/json", text: JSON.stringify(publicCatalog())}]}));
  return server;
}
