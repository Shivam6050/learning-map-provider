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
 // Never trust caller-supplied forwarding headers for authentication redirects.
 return process.env.NODE_ENV === "production" ? new URL(getSiteUrl()).origin : new URL(request.url).origin;
}
