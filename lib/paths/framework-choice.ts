export const BACKEND_FRAMEWORKS = ["django", "express", "fastapi", "flask", "spring", "laravel", "rails", "gin"] as const;
export type BackendFramework = typeof BACKEND_FRAMEWORKS[number];

export const FRAMEWORK_LABELS: Record<BackendFramework, string> = {
  django: "Django",
  express: "Express",
  fastapi: "FastAPI",
  flask: "Flask",
  spring: "Spring Boot",
  laravel: "Laravel",
  rails: "Ruby on Rails",
  gin: "Go · Gin",
};

type FrameworkResource = { title?: string | null; url?: string | null };

export function detectBackendFramework(resource: FrameworkResource): BackendFramework | null {
  const text = `${resource.title ?? ""} ${resource.url ?? ""}`.toLowerCase();
  if (/\b(django)\b/.test(text)) return "django";
  if (/\b(express(?:\.js)?|expressjs)\b/.test(text)) return "express";
  if (/\b(fastapi|fast-api)\b/.test(text)) return "fastapi";
  if (/\b(flask)\b/.test(text)) return "flask";
  if (/\b(spring boot|springboot)\b/.test(text)) return "spring";
  if (/\b(laravel)\b/.test(text)) return "laravel";
  if (/\b(ruby on rails|rails)\b/.test(text)) return "rails";
  if (/\b(gin-gonic|gin framework|golang gin)\b/.test(text)) return "gin";
  return null;
}

export function backendFrameworks(resources: FrameworkResource[]): BackendFramework[] {
  return BACKEND_FRAMEWORKS.filter(framework => resources.some(resource => detectBackendFramework(resource) === framework));
}
