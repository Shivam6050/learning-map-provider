export function ensureHttpUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  const trimmed = rawUrl.trim();
  if (/^[a-z0-9+.-]+:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function isSafeHttpUrl(rawUrl: string): boolean {
  try {
    const safeUrl = ensureHttpUrl(rawUrl);
    const url = new URL(safeUrl);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (url.username || url.password || (url.port && !["80", "443"].includes(url.port))) return false;
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || !host.includes(".")) return false;
    if (host.includes(":")) return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const [a,b] = host.split(".").map(Number);
      if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
