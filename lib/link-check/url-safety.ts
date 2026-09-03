export function ensureHttpUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  let trimmed = rawUrl.trim();
  if (/^[a-z0-9+.-]+:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function isSafeHttpUrl(rawUrl: string): boolean {
  try {
    const safeUrl = ensureHttpUrl(rawUrl);
    const url = new URL(safeUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
