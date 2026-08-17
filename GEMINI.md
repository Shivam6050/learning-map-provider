# Gemini AI Integration Guide

This project uses **Google Gemini API** to generate personalized learning paths and match candidate learning resources.

---

## Overview

- **Integration**: Google Gemini REST API / SDK
- **Default Model**: `gemini-2.5-flash` (with fallback to `gemini-1.5-flash`)
- **Response Format**: Native JSON (`response_mime_type: "application/json"`)
- **Environment Variable**: `GEMINI_API_KEY`

---

## Architecture & File Structure

| Component | Path | Description |
| :--- | :--- | :--- |
| **Gemini Client Helper** | [`lib/ai/client.ts`](file:///c:/Users/60shi/OneDrive/Desktop/learning-map/lib/ai/client.ts) | Initializes Gemini API calls lazily and provides defensive `callForJson<T>()` helper with markdown fence cleanup. |
| **Stage 1 (Skeleton)** | [`lib/ai/skeleton.ts`](file:///c:/Users/60shi/OneDrive/Desktop/learning-map/lib/ai/skeleton.ts) | Generates 5–9 ordered curriculum stages based on skill level and weekly hours. |
| **Stage 3+4 (Assembly)** | [`lib/ai/assemble.ts`](file:///c:/Users/60shi/OneDrive/Desktop/learning-map/lib/ai/assemble.ts) | Selects and matches real resources from candidate seed pool within user budget and generates practice checks. |
| **Candidate Seed Pool** | [`lib/ai/seed-resources.ts`](file:///c:/Users/60shi/OneDrive/Desktop/learning-map/lib/ai/seed-resources.ts) | Static resource pool for Backend Development. |

---

## Setup & Configuration

1. **Obtain an API Key**:
   Create an API key at [aistudio.google.com](https://aistudio.google.com).

2. **Set Environment Variable**:
   Add your key to `.env.local` or `.env`:
   ```env
   GEMINI_API_KEY=AIzaSy_your_actual_gemini_api_key_here
   ```

3. **Fallback & Error Safety**:
   If `GEMINI_API_KEY` is missing or contains placeholder values during local development, `callForJson()` provides structured fallback seed data so path generation works safely.
