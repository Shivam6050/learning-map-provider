/** Retrieve a calendar without turning login pages or API errors into downloads. */
export async function fetchCalendar(url: string): Promise<Blob> {
 const response = await fetch(url, {credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(20000)});
 if (response.redirected || response.status === 401 || response.status === 403) {
  throw new Error("Your session may have expired. Sign in again, then retry the download.");
 }
 if (!response.ok) {
  if (response.status === 400 && response.headers.get("content-type")?.includes("application/json")) {
   const body = await response.json().catch(() => null);
   if (typeof body?.error === "string" && body.error.length < 300) throw new Error(body.error);
  }
  throw new Error(response.status === 404 ? "This roadmap is no longer available. Refresh the page and try again." : "We couldn’t prepare your calendar. Please try again shortly.");
 }
 if (!response.headers.get("content-type")?.toLowerCase().startsWith("text/calendar")) {
  throw new Error("We couldn’t retrieve your calendar. Refresh the page and sign in again if needed.");
 }
 const content = await response.text();
 if (!content.startsWith("BEGIN:VCALENDAR") || !content.trimEnd().endsWith("END:VCALENDAR")) throw new Error("The calendar file is incomplete. Please try again.");
 return new Blob([content], {type: "text/calendar;charset=utf-8"});
}
