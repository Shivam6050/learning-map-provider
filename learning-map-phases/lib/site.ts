export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production" && process.env.VERCEL_URL) {
    const vUrl = process.env.VERCEL_URL.trim().replace(/\/$/, "");
    return vUrl.startsWith("http://") || vUrl.startsWith("https://") ? vUrl : `https://${vUrl}`;
  }

  return "http://localhost:3000";
}

export function getRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  return requestUrl.origin;
}
