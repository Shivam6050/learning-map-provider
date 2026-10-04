import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { PUBLIC_GUIDE_PATHS } from "@/lib/fields/public-guides";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/roadmaps", ...PUBLIC_GUIDE_PATHS, "/integrations", "/privacy", "/terms"].map(path => ({url: getSiteUrl() + path}));
}
