import { publicRoadmap, LEVELS } from "@/lib/mcp/catalog";
import { getFieldBySlug } from "@/lib/fields/catalog";
import { PUBLIC_CATALOG_HEADERS } from "@/lib/mcp/http";
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const field = params.get("field") ?? "";
  const level = params.get("level") ?? "beginner";
  if (params.getAll("field").length !== 1 || params.getAll("level").length > 1 || !getFieldBySlug(field) || !LEVELS.some(value => value === level)) {
    return Response.json({error: "Provide one supported field slug and level (beginner, intermediate, advanced)."}, {status: 400, headers: {...PUBLIC_CATALOG_HEADERS, "Cache-Control": "no-store"}});
  }
  return Response.json(publicRoadmap(field,level), {headers: PUBLIC_CATALOG_HEADERS});
}
