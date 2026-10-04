import { afterEach, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { getPublicGuide } from "@/lib/fields/public-guides";
import { curriculumUnits, topicDefinitions } from "@/lib/paths/authored-curriculum";
import { breadcrumbData, publicPageMetadata, serializeJsonLd } from "./seo";

afterEach(() => vi.unstubAllEnvs());

it("publishes every supported field and level using the real authored curriculum", () => {
  for (const field of FIELD_CATALOG) {
    const guide = getPublicGuide(field.slug)!;
    expect(guide.name).toBe(field.name);
    for (const level of ["beginner", "intermediate", "advanced"]) {
      const units = guide.units.filter(unit => unit.level === level);
      expect(units.length).toBeGreaterThan(0);
      expect(units).toEqual(curriculumUnits.filter(unit => unit.field === field.slug && unit.level === level));
      for (const unit of units) {
        expect(unit.project).toBeTruthy();
        for (const topic of unit.topicIds) expect(topicDefinitions[topic]).toBeDefined();
      }
    }
  }
  expect(getPublicGuide("not-a-field")).toBeUndefined();
  expect(getPublicGuide("toString")).toBeUndefined();
});

it("includes public guides in the canonical sitemap and excludes all personal routes", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://learningmap.example");
  const urls = sitemap().map(entry => entry.url);
  expect(new Set(urls).size).toBe(urls.length);
  for (const field of FIELD_CATALOG) expect(urls).toContain(`https://learningmap.example/roadmaps/${field.slug}`);
  expect(urls).toContain("https://learningmap.example/roadmaps");
  for (const url of urls) {
    expect(url).toMatch(/^https:\/\/learningmap\.example\//);
    expect(new URL(url).pathname).not.toMatch(/^\/(paths|settings|dashboard|onboarding|auth|login|signup)/);
    expect(new URL(url).search).toBe("");
  }
});

it("keeps canonical and share URLs on the same page and creates ordered breadcrumb URLs", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://learningmap.example");
  const metadata = publicPageMetadata("/roadmaps/backend-development", "Backend roadmap", "Guide");
  expect(metadata.alternates?.canonical).toBe("/roadmaps/backend-development");
  expect(metadata.openGraph).toMatchObject({ url: "/roadmaps/backend-development" });
  const data = breadcrumbData([{name:"Home",path:"/"},{name:"Roadmaps",path:"/roadmaps"}]);
  expect(data.itemListElement.map(item => [item.position,item.item])).toEqual([[1,"https://learningmap.example/"],[2,"https://learningmap.example/roadmaps"]]);
});

it("prevents a structured data string from breaking out of its script element", () => {
  const unsafe = {name: "</script><script>alert(1)</script>"};
  const encoded = serializeJsonLd(unsafe);
  expect(encoded).not.toContain("<");
  expect(JSON.parse(encoded)).toEqual(unsafe);
});
