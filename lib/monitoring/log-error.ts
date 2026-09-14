/**
 * Deliberately not @sentry/nextjs or any other vendor SDK — this
 * project is on Next.js 16 with Turbopack, and adding a heavyweight
 * SDK with configuration conventions I can't verify against that exact
 * combination risks breaking the build in a way that's hard to debug
 * remotely. A plain webhook POST works with literally anything that
 * accepts one (Sentry's own inbound webhook, a Slack channel, Discord,
 * a custom endpoint) and can't break the build regardless of what's
 * behind MONITORING_WEBHOOK_URL.
 *
 * To wire in a real provider: point MONITORING_WEBHOOK_URL at
 * whatever endpoint your provider gives you for inbound events, or
 * write a thin adapter here if their format needs translation.
 */
export async function logError(context: string, error: unknown): Promise<void> {
  const message = redact(error instanceof Error ? error.message : String(error));
  const stack = undefined; // Do not forward stack traces or request context to external webhooks.

  console.error(`[${context}]`, message);

  const webhookUrl = process.env.MONITORING_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      signal: AbortSignal.timeout(3000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context,
        message,
        stack,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      }),
    });
  } catch {
    // The monitoring call itself failing must never break the
    // request it's reporting on — swallow, the console.error above
    // already happened.
  }
}

function redact(text: string): string {
 let safe = text;
 for (const [name, value] of Object.entries(process.env)) {
  if (/KEY|SECRET|TOKEN|PASSWORD/.test(name) && value && value.length > 7) safe = safe.split(value).join("[redacted]");
 }
 return safe.replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]").replace(/([?&](?:key|token|code|password)=)[^&\s]+/gi, "$1[redacted]").slice(0,1000);
}
