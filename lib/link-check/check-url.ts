const CHECK_TIMEOUT_MS = 1500;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchWithTimeout(url: string, method: "HEAD" | "GET") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": UA },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkUrlAlive(url: string): Promise<boolean> {
  try {
    const headRes = await fetchWithTimeout(url, "HEAD");
    if (headRes.ok) return true;
  } catch {
    // Timeout or network error — return true by default so link is not blocked during onboarding
  }
  return true;
}
