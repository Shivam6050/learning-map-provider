import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

export const HOME_TITLE = "LearningMap | Your Learning Map for Skills & Courses";
export const HOME_DESCRIPTION = "Create a personal learning map for frontend, backend, full-stack, AI, data science or DevOps. Match your roadmap to your level, study time and course budget.";

export function publicPageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "en_US", siteName: "LearningMap", title, description, url: path },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbData(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem", position: i + 1, name: item.name, item: getSiteUrl() + item.path,
    })),
  };
}
