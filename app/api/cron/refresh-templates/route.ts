import { publishRoadmapTemplates, TemplatePublicationError } from "@/lib/templates/publish";
import { logError } from "@/lib/monitoring/log-error";
export const maxDuration = 60;
function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return json({ error: "Unauthorized" }, 401);
  try {
    // Reserve time for the current verification batch, bounded DB requests and error reporting.
    const result = await publishRoadmapTemplates(true, { verificationDeadline: Date.now() + 30000 });
    return json(result);
  } catch (error) {
    const known = error instanceof TemplatePublicationError;
    const reason = known ? error.reason : "unexpected_failure";
    const publication = known ? error.publication : "unknown";
    await logError("templates/refresh", new Error(`Template refresh failed during ${reason}; publication ${publication}`));
    return json({ error: publication === "not_started" ? "Template refresh stopped before publication; existing versions were not replaced" : "Template publication could not be confirmed; inspect the version before retrying", reason, publication, ...(known && error.version !== undefined ? { version: error.version } : {}) }, 503);
  }
}
