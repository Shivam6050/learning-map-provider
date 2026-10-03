import { publicCatalog } from "@/lib/mcp/catalog";
import { PUBLIC_CATALOG_HEADERS } from "@/lib/mcp/http";
export function GET() { return Response.json(publicCatalog(), {headers: PUBLIC_CATALOG_HEADERS}); }
