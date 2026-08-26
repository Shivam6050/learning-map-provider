export const GEMINI_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
];

export const MODEL = GEMINI_MODEL_CANDIDATES[0];

const PLACEHOLDER_KEY_MARKERS = ["your-gemini", "your-groq-api-key", "gsk_placeholder"];

function isConfiguredKey(key: string | undefined): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_KEY_MARKERS.some((marker) => trimmed.includes(marker));
}

function requireKey(): string {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!isConfiguredKey(geminiKey)) {
    throw new Error(
      "GEMINI_API_KEY is missing or still a placeholder value. Set a real key in .env.local (see .env.local.example)."
    );
  }
  return geminiKey;
}

/**
 * Calls the Gemini API with one model, throwing with the real cause on
 * any failure — HTTP error, missing text in the response, or invalid
 * JSON — instead of returning null and letting the caller guess why.
 */
async function callOneModel<T>(
  model: string,
  apiKey: string,
  params: { system: string; user: string }
): Promise<T> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: params.system }] },
        contents: [{ parts: [{ text: params.user }] }],
        generationConfig: { response_mime_type: "application/json" },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini ${model} returned ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(
      `Gemini ${model} returned no text content: ${JSON.stringify(data).slice(0, 300)}`
    );
  }

  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Gemini ${model} returned invalid JSON: ${cleaned.slice(0, 300)}`);
  }
}

/**
 * Calls Gemini using GEMINI_API_KEY, trying each model in
 * GEMINI_MODEL_CANDIDATES in order until one succeeds. Trying multiple
 * models is a legitimate resilience feature (a model rename/deprecation
 * shouldn't break the whole app) — but if EVERY model fails, or the key
 * is missing/a placeholder, this throws a real error with all the
 * per-model failure reasons attached. It does NOT return fabricated
 * fallback content on failure: a caller getting a result back can trust
 * it's real, and a caller catching an error knows something is actually
 * broken and needs fixing, rather than silently seeing fake data.
 */
export async function callForJson<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const geminiKey = requireKey();

  const failures: string[] = [];
  for (const model of GEMINI_MODEL_CANDIDATES) {
    try {
      return await callOneModel<T>(model, geminiKey, params);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[gemini] ${model} failed:`, message);
      failures.push(`${model}: ${message}`);
    }
  }

  throw new Error(
    `All Gemini models failed. Tried: ${GEMINI_MODEL_CANDIDATES.join(", ")}.\n${failures.join("\n")}`
  );
}

export type GroundingChunk = { url: string; title: string };

/**
 * Calls Gemini WITH real Google Search grounding enabled. Cannot be
 * combined with forced JSON output — Gemini's API rejects that
 * combination for these models — so this returns the raw grounding
 * chunks (real uri/title pairs from actual search results) instead of
 * asking the model to self-report URLs as JSON. Trusting groundingChunks
 * over model-generated text is the actual anti-hallucination guarantee
 * here: these come from the API's own search execution, not from the
 * model being well-behaved about a prompt instruction.
 */
export async function callWithGoogleSearch(params: {
  prompt: string;
}): Promise<{ text: string; chunks: GroundingChunk[] }> {
  const geminiKey = requireKey();

  const failures: string[] = [];
  for (const model of GEMINI_MODEL_CANDIDATES) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: params.prompt }] }],
            tools: [{ google_search: {} }],
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Gemini ${model} (grounded) returned ${res.status}: ${body.slice(0, 300)}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      const chunks: GroundingChunk[] = (candidate?.groundingMetadata?.groundingChunks ?? [])
        .filter((c: any) => c.web?.uri)
        .map((c: any) => ({ url: c.web.uri, title: c.web.title ?? c.web.uri }));

      return { text, chunks };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[gemini grounded] ${model} failed:`, message);
      failures.push(`${model}: ${message}`);
    }
  }

  throw new Error(
    `All Gemini models failed (grounded search). Tried: ${GEMINI_MODEL_CANDIDATES.join(", ")}.\n${failures.join("\n")}`
  );
}
