# Groq AI Integration Guide

This project uses **Groq** (`groq-sdk`) to generate personalized learning paths and match candidate learning resources.

---

## Overview

- **SDK Package**: `groq-sdk`
- **Default Model**: `llama-3.3-70b-versatile`
- **Response Format**: Native JSON (`response_format: { type: "json_object" }`)
- **Environment Variable**: `GROQ_API_KEY`

---

## Architecture & File Structure

| Component | Path | Description |
| :--- | :--- | :--- |
| **Groq Client Helper** | [`lib/ai/client.ts`](file:///c:/Users/60shi/OneDrive/Desktop/learning-map/learning-map-0/lib/ai/client.ts) | Initializes Groq SDK lazily and provides defensive `callForJson<T>()` helper with markdown fence cleanup. |
| **Stage 1 (Skeleton)** | [`lib/ai/skeleton.ts`](file:///c:/Users/60shi/OneDrive/Desktop/learning-map/learning-map-0/lib/ai/skeleton.ts) | Generates 5–9 ordered curriculum stages based on skill level and weekly hours. |
| **Stage 3+4 (Assembly)** | [`lib/ai/assemble.ts`](file:///c:/Users/60shi/OneDrive/Desktop/learning-map/learning-map-0/lib/ai/assemble.ts) | Selects and matches real resources from candidate seed pool within user budget and generates practice checks. |
| **Candidate Seed Pool** | [`lib/ai/seed-resources.ts`](file:///c:/Users/60shi/OneDrive/Desktop/learning-map/learning-map-0/lib/ai/seed-resources.ts) | Static resource pool for Backend Development. |

---

## Setup & Configuration

1. **Obtain an API Key**:
   Create a free API key at [console.groq.com](https://console.groq.com).

2. **Set Environment Variable**:
   Add your key to `.env.local`:
   ```env
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   ```

3. **Fallback & Error Safety**:
   If `GROQ_API_KEY` is missing or contains placeholder values during local development, `callForJson()` throws a clear instructions error rather than crashing the application build.
