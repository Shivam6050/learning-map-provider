import "server-only";

/** Application credential stays on the server; user clients still enforce RLS. */
export function getSupabaseConfig(): {url: string; key: string} | null {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key?.startsWith("sb_publishable_") || key.includes("placeholder")) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) return null;
    if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/" || parsed.hostname.includes("your-project") || parsed.hostname === "example.com") return null;
    return {url: parsed.origin, key};
  } catch { return null; }
}
