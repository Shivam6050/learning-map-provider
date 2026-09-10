import { isSafeHttpUrl } from "./url-safety";

export type LinkStatus = "ok" | "broken" | "unknown";

/** A blocked or unavailable check is not evidence that a course exists. */
export async function inspectUrl(url: string): Promise<{ status: LinkStatus; url: string; html?: string }> {
  let current = url;
  const signal = AbortSignal.timeout(6000);
  try {
    for (let hop = 0; hop < 6; hop++) {
      if (!isSafeHttpUrl(current)) return { status: "broken", url: current };
      const response = await fetch(current, {
        method: "GET", redirect: "manual", signal, cache: "no-store",
        headers: { "User-Agent": "LearningMap-LinkChecker/1.0", Accept: "text/html" },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return { status: "unknown", url: current };
        current = new URL(location, current).href;
        await response.body?.cancel();
        continue;
      }
      if (response.status === 404 || response.status === 410) return { status: "broken", url: current };
      if (!response.ok) return { status: "unknown", url: current };
      const reader = response.body?.getReader();
      let html = "";
      const decoder = new TextDecoder();
      if (reader) {
        try {
          while (html.length < 300_000) {
            const { done, value } = await reader.read();
            if (done) break;
            html += decoder.decode(value, { stream: true });
          }
        } finally { await reader.cancel(); }
      }
      const heading = html.match(/<(?:title|h1)[^>]*>([\s\S]*?)<\/(?:title|h1)>/i)?.[1] ?? "";
      if (/page not found|course not found|404|no longer available|does not exist/i.test(heading)) {
        return { status: "broken", url: current };
      }
      if (/just a moment|access denied|verify you are human|sign in|log in/i.test(heading)) {
        return { status: "unknown", url: current };
      }
      const original = new URL(url);
      const destination = new URL(current);
      if (/\/(course|learn|specializations)\//.test(original.pathname) &&
          !/\/(course|learn|specializations)\/[^/]+/.test(destination.pathname)) {
        return { status: "broken", url: current };
      }
      return { status: "ok", url: current, html };
    }
  } catch { /* A timeout is unknown, never a successful verification. */ }
  return { status: "unknown", url: current };
}

export async function checkUrlAlive(url: string): Promise<boolean> {
  return (await inspectUrl(url)).status === "ok";
}
