import { ensureHttpUrl, isSafeHttpUrl } from "@/lib/link-check/url-safety";

// Public referral identifier supplied by the site owner; this is not a secret.
export const SCRIMBA_REFERRAL_CODE = "u4355626";
export const W3SCHOOLS_REFERRAL_CODE = "SHIVAMSAGAR";
export const W3SCHOOLS_STORE_URL = "https://campus.w3schools.com/SHIVAMSAGAR";

/** Only Campus product pages participate; free w3schools.com tutorials stay untouched. */
export function hasW3SchoolsOffer(rawUrl: string): boolean {
  try {
    const url = new URL(ensureHttpUrl(rawUrl));
    return isSafeHttpUrl(url.href) && url.hostname === "campus.w3schools.com"
      && /^\/(?:[a-z]{2}-[a-z]{2}\/)?products\/[^/]+\/?$/.test(url.pathname);
  } catch { return false; }
}

export function courseLink(rawUrl: string, existingAffiliate = false): { href: string; affiliate: boolean } {
  const safe = ensureHttpUrl(rawUrl);
  if (!safe || !isSafeHttpUrl(safe)) return { href: "", affiliate: false };
  const url = new URL(safe);
  if (["scrimba.com", "www.scrimba.com"].includes(url.hostname)) {
    url.searchParams.set("via", SCRIMBA_REFERRAL_CODE);
    return { href: url.href, affiliate: true };
  }
  if (hasW3SchoolsOffer(safe)) {
    // The owner-supplied storefront resolves to this official discount route.
    // dt_id is the public partner identifier returned by W3Schools, not a secret.
    const destination = new URL("https://campus.w3schools.com/discount/" + W3SCHOOLS_REFERRAL_CODE);
    url.searchParams.delete("dt_id");
    destination.searchParams.set("dt_id", "3606743");
    destination.searchParams.set("redirect", url.pathname + url.search + url.hash);
    return { href: destination.href, affiliate: true };
  }
  return { href: safe, affiliate: existingAffiliate };
}
