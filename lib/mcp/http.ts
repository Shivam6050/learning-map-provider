import { getSiteUrl } from "@/lib/site";

export function allowedBrowserOrigin(request: Request): string | null | false {
  const origin = request.headers.get("origin");
  if (!origin) return null; // Native MCP clients do not send browser Origin headers.
  const allowed = [new URL(getSiteUrl()).origin, ...(process.env.MCP_ALLOWED_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean)];
  if (process.env.NODE_ENV !== "production") allowed.push(new URL(request.url).origin);
  return allowed.includes(origin) ? origin : false;
}
export function mcpHeaders(origin: string | null) {
  const headers = new Headers({ "Cache-Control": "no-store", "Vary": "Origin", "X-Content-Type-Options": "nosniff" });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id");
    headers.set("Access-Control-Expose-Headers", "WWW-Authenticate, MCP-Protocol-Version, MCP-Session-Id");
  }
  return headers;
}
