import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return { rules: {userAgent: "*", allow: ["/", "/api/public/"], disallow: ["/dashboard", "/settings", "/paths/", "/onboarding/select", "/admin/", "/auth/", "/complete-profile", "/verify-contact", "/reset-password", "/api/", "/mcp"]}, sitemap: getSiteUrl() + "/sitemap.xml" };
}
