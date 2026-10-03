import { getSiteUrl } from "@/lib/site";
export function GET() {
  const site = getSiteUrl();
  return new Response(`# LearningMap

> LearningMap provides learning roadmaps for six technology fields, adapted to experience, time and budget.

## Public access
- [Integration guide](${site}/integrations): MCP setup, capabilities and limits.
- [Public catalog](${site}/api/public/catalog): fields, levels and curated resource references as JSON.
- [Example curriculum](${site}/api/public/roadmap?field=backend-development&level=beginner): authored curriculum preview, not a personal saved path.
- [Privacy](${site}/privacy)
- [Terms](${site}/terms)

## MCP
Streamable HTTP endpoint: ${site}/mcp
No authentication is needed for the public, read-only tools: list_learning_fields, get_curriculum_preview, search_learning_resources.
Resource URI: learningmap://catalog

## Limits
Personal paths, notes, accounts and progress are private and not exposed through MCP.
This interface cannot purchase courses, generate personalized paths, send messages or modify calendars.
Catalog free-access labels are not live quotes. Verify links and access on provider websites. Regional subscriptions, discounts, taxes and certificates may differ.
No claim is made that any particular bot automatically discovers or indexes this website. Connect MCP-capable clients explicitly.
`, {headers: {"Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600"}});
}
