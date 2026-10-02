/** CSP for dynamic Next.js pages. Inline styles remain allowed for React style props. */
export function contentSecurityPolicy(nonce: string, supabaseUrl?: string, development = false) {
  if (!/^[A-Za-z0-9+/=_-]+$/.test(nonce)) throw new Error("Invalid CSP nonce");
  const connections = ["'self'"];
  try {
    const url = new URL(supabaseUrl ?? "");
    if (url.protocol === "https:" || (development && url.protocol === "http:")) {
      connections.push(url.origin, url.origin.replace(/^http/, "ws"));
    }
  } catch { /* Missing configuration already has a safe auth fallback. */ }
  if (development) connections.push("ws://localhost:*", "ws://127.0.0.1:*");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connections.join(" ")}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
