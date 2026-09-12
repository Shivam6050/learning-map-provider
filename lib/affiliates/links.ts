import { ensureHttpUrl } from "@/lib/link-check/url-safety";

// Public referral identifier supplied by the site owner; this is not a secret.
export const SCRIMBA_REFERRAL_CODE = "u4355626";

export function courseLink(rawUrl: string, existingAffiliate = false): { href: string; affiliate: boolean } {
  const safe = ensureHttpUrl(rawUrl);
  if (!safe) return { href: "", affiliate: false };
  const url = new URL(safe);
  if (["scrimba.com", "www.scrimba.com"].includes(url.hostname)) {
    url.searchParams.set("via", SCRIMBA_REFERRAL_CODE);
    return { href: url.href, affiliate: true };
  }
  return { href: safe, affiliate: existingAffiliate };
}
