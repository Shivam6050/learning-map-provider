import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/integrations", "/privacy", "/terms"].map(path => ({url: getSiteUrl() + path}));
}
