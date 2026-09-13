export function launchLimits(env: Record<string, string | undefined> = process.env) {
 const integer = (value: string | undefined, fallback: number, max: number) => { const n = Number(value); return Number.isInteger(n) && n >= 1 && n <= max ? n : fallback; };
 return { userDaily: integer(env.MAX_GENERATIONS_PER_DAY, 3, 100), globalDaily: integer(env.MAX_GLOBAL_GENERATIONS_PER_DAY, 20, 1000), paused: env.GENERATION_PAUSED === "true", searchEnabled: env.ENABLE_GROUNDED_SEARCH === "true" };
}
