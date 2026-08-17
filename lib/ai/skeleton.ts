import { callForJson } from "@/lib/ai/client";

export type SkeletonStage = {
  order_index: number;
  title: string;
  description: string;
  estimated_hours: number;
  search_topics: string[];
};

const SYSTEM_PROMPT = `You are a curriculum designer. Given a field and a learner's self-reported level, produce an ordered list of learning stages that take a learner from their current level toward competency in the field.

Rules:
- 5 to 9 stages. Fewer for narrow topics, more for broad ones.
- Each stage should represent 1-3 weeks of effort at the learner's stated weekly hours.
- Do not name specific resources, courses, or videos — that happens in a later step. Only describe what the stage covers.
- Output ONLY valid JSON matching the schema below. No prose, no markdown fences.

Schema:
{
  "stages": [
    {
      "order_index": 0,
      "title": "string, max 8 words",
      "description": "string, 1-2 sentences",
      "estimated_hours": integer,
      "search_topics": ["string", ...]
    }
  ]
}`;

export async function generateSkeleton(params: {
  fieldName: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  weeklyHours: number;
}): Promise<SkeletonStage[]> {
  const user = `Field: ${params.fieldName}
Learner level: ${params.skillLevel}
Weekly time available: ${params.weeklyHours} hours`;

  const result = await callForJson<{ stages: SkeletonStage[] }>({
    system: SYSTEM_PROMPT,
    user,
  });

  return result.stages;
}
