type EmailProvider = "brevo" | "resend";
function provider(): EmailProvider | null {
  const value = process.env.EMAIL_PROVIDER?.trim() || "resend";
  return value === "brevo" || value === "resend" ? value : null;
}
function sender() {
  const value = process.env.EMAIL_FROM_ADDRESS?.trim() || "";
  const match = value.match(/^([^<>]*)<([^<>]+)>$/);
  const email = match ? match[2].trim() : value;
  if (/[\r\n]/.test(value) || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)
      || email.toLowerCase().endsWith("@resend.dev")) return null;
  return {email, name: match?.[1].trim() || "LearningMap"};
}
export function emailDeliveryConfigured(): boolean {
  const selected = provider();
  return Boolean(sender() && selected && (selected === "brevo" ? process.env.BREVO_API_KEY : process.env.RESEND_API_KEY));
}

/** Server-side reminders. Auth verification emails use Supabase's separate SMTP configuration. */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}): Promise<boolean> {
  const selected = provider();
  const from = sender();
  if (!emailDeliveryConfigured() || !from) {
    console.error("[email] A valid sender and selected provider key are required — skipping send");
    return false;
  }
  const brevo = selected === "brevo";
  const headers: Record<string, string> = {"Content-Type": "application/json"};
  if (brevo) headers["api-key"] = process.env.BREVO_API_KEY!;
  else {
    headers.Authorization = `Bearer ${process.env.RESEND_API_KEY}`;
    if (params.idempotencyKey) headers["Idempotency-Key"] = params.idempotencyKey;
  }
  // The database delivery claim prevents duplicates for both providers.
  // Never fail over or automatically retry an uncertain send.
  const body = brevo
    ? {sender: from, to: [{email: params.to}], replyTo: from, subject: params.subject, htmlContent: params.html}
    : {from: process.env.EMAIL_FROM_ADDRESS, to: params.to, subject: params.subject, html: params.html};
  try {
    const response = await fetch(brevo ? "https://api.brevo.com/v3/smtp/email" : "https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(8000), headers, body: JSON.stringify(body),
    });
    if (!response.ok) {
      // Provider bodies may contain addresses or message content; keep them out of logs.
      console.error(`[email] ${selected} returned HTTP ${response.status}`);
      return false;
    }
    if (brevo) {
      const result = await response.json() as {messageId?: unknown};
      return typeof result.messageId === "string" && result.messageId.length > 0;
    }
    return true;
  } catch {
    console.error(`[email] ${selected} delivery outcome is unknown`);
    return false;
  }
}
