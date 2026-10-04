import { headers } from "next/headers";
import { serializeJsonLd } from "@/lib/seo";

// The proxy overwrites this header with its own per-request policy.
// Reuse that nonce rather than weakening the site's script policy for structured data.
export async function JsonLd({ data }: { data: unknown }) {
  const policy = (await headers()).get("content-security-policy");
  const nonce = policy?.match(/'nonce-([A-Za-z0-9+/=_-]+)'/)?.[1];
  return <script type="application/ld+json" nonce={nonce}
    dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
