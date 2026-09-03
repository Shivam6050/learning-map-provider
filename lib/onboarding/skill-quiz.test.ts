import { describe, it, expect } from "vitest";
import { blendSkillLevel, BACKEND_DEV_QUIZ } from "@/lib/onboarding/skill-quiz";

const allCorrect = BACKEND_DEV_QUIZ.map((q) => q.correctIndex);
const allWrong = BACKEND_DEV_QUIZ.map((q) => (q.correctIndex + 1) % q.options.length);

describe("blendSkillLevel", () => {
  it("blends a matching self-report and quiz score to the same level", () => {
    // All correct -> quiz implies advanced. Self-reported advanced too.
    const result = blendSkillLevel("advanced", allCorrect);
    expect(result.finalLevel).toBe("advanced");
    expect(result.quizScore).toBe(5);
  });

  it("averages a mismatched self-report and quiz result rather than picking either extreme", () => {
    // Self-reported advanced (index 2), quiz all wrong -> implies beginner (index 0).
    // Average of 2 and 0 rounds to 1 -> intermediate, not either extreme.
    const result = blendSkillLevel("advanced", allWrong);
    expect(result.finalLevel).toBe("intermediate");
    expect(result.quizImpliedLevel).toBe("beginner");
  });

  it("treats malformed/missing answers as incorrect rather than throwing", () => {
    const malformed = [NaN, -1, 99, undefined as unknown as number, NaN];
    expect(() => blendSkillLevel("beginner", malformed)).not.toThrow();
    const result = blendSkillLevel("beginner", malformed);
    expect(result.quizScore).toBe(0);
  });

  it("never produces a level outside the valid three", () => {
    for (const level of ["beginner", "intermediate", "advanced"] as const) {
      const result = blendSkillLevel(level, allCorrect);
      expect(["beginner", "intermediate", "advanced"]).toContain(result.finalLevel);
    }
  });
});
