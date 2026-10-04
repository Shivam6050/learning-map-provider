import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return { rules: {userAgent: "*", allow: "/", disallow: ["/dashboard", "/settings", "/paths/", "/onboarding", "/admin/", "/auth/", "/complete-profile", "/verify-contact", "/reset-password", "/api/", "/mcp"]}, sitemap: getSiteUrl() + "/sitemap.xml" };
}
