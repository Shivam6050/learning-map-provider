<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Pipeline & Groq Integration Rules

- **Provider & SDK**: Use `groq-sdk` (imported from `groq-sdk`), configured with `GROQ_API_KEY`. Do NOT import or use `@anthropic-ai/sdk`.
- **Model Standard**: Use `llama-3.3-70b-versatile` with native JSON mode (`response_format: { type: "json_object" }`).
- **Server-Only Security**: All files in `lib/ai/` and `lib/db/` are server-only and read server environment variables. Never import them into Client Components (`"use client"`).
- **Defensive Parsing**: Use `callForJson<T>()` from `@/lib/ai/client` to execute prompt completions and parse structured JSON responses safely.
- **Anti-Hallucination Enforcement**: Always filter AI-generated resource URLs against known candidate pool URLs before inserting into the database.
