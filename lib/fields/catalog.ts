export type Field = { slug: string; name: string; hasQuiz: boolean };

export const FIELD_CATALOG: Field[] = [
  { slug: "backend-development", name: "Backend Development", hasQuiz: true },
  { slug: "frontend-development", name: "Frontend Development", hasQuiz: true },
  { slug: "full-stack-development", name: "Full-Stack Development", hasQuiz: true },
  { slug: "ai-machine-learning", name: "AI & Machine Learning", hasQuiz: true },
  { slug: "data-science", name: "Data Science", hasQuiz: true },
  { slug: "devops-cloud", name: "DevOps & Cloud", hasQuiz: true },
];

export function getFieldBySlug(slug: string): Field | undefined {
  return FIELD_CATALOG.find((f) => f.slug === slug);
}
