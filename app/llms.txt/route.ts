import { getSiteUrl } from "@/lib/site";
export function GET() {
  const site = getSiteUrl();
  const lines = [
    "# LearningMap",
    "",
    "> LearningMap provides learning roadmaps for six technology fields, adapted to experience, time and budget.",
    "",
    "## Discovery and sign-in",
    "- [Integration guide](" + site + "/integrations): MCP setup, capabilities and limits.",
    "- [LearningMap skill for AI agents](" + site + "/skills/learningmap-roadmap-guide): indexed overview, compatibility requirements and downloads.",
    "- [Skill instructions](" + site + "/skills/learningmap-roadmap-guide/SKILL.md): portable SKILL.md format.",
    "- [Download skill package](" + site + "/downloads/learningmap-roadmap-guide.zip): ZIP for compatible skill marketplaces and clients.",
    "- [Catalog API — authentication required](" + site + "/api/public/catalog): fields, levels and curated resource references as JSON.",
    "- [Example curriculum API — authentication required](" + site + "/api/public/roadmap?field=backend-development&level=beginner): authored curriculum preview, not a personal saved path.",
    "- [Privacy](" + site + "/privacy)",
    "- [Terms](" + site + "/terms)",
    "",
    "## MCP",
    "Streamable HTTP endpoint: " + site + "/mcp",
    "The human owner must sign in with a verified email at " + site + "/settings/agents and confirm their account password to create a scoped agent key. Never ask the user to give the bot their password. Configure Authorization: Bearer YOUR_AGENT_KEY in private client settings. Passwords, browser cookies and Supabase tokens are not accepted.",
    "Authentication is required for tools and resource reads: list_learning_fields, get_curriculum_preview, search_learning_resources.",
    "Automatic OAuth login is not implemented; clients must support remote Streamable HTTP and custom Authorization headers. Keys expire after 30 days and can be revoked from Settings.",
    "Resource URI: learningmap://catalog",
    "",
    "## Search and compatibility",
    "The public skill and integration guide are available for search and crawler discovery. Skill invocation syntax and MCP support vary by AI agent. Installing the skill does not automatically register or connect LearningMap in every product; configure the server separately in each compatible client.",
    "",
    "## Limits",
    "Personal paths, notes, accounts and progress are private and not exposed through MCP.",
    "This interface cannot purchase courses, generate personalized paths, send messages or modify calendars.",
    "Catalog free-access labels are not live quotes. Verify links and access on provider websites. Regional subscriptions, discounts, taxes and certificates may differ."
  ];
  return new Response(lines.join("\n"), {headers: {"Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600"}});
}