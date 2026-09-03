const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends via Resend's REST API directly rather than adding their SDK —
 * this is a single POST with a bearer token, not worth a dependency.
 * Returns false on failure rather than throwing: a reminder email
 * failing to send shouldn't crash the cron run for every other user
 * in the batch.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? "Learning Map <onboarding@resend.dev>";

  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is not set — skipping send");
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend returned ${res.status}: ${body.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
