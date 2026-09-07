import fs from "fs";
import path from "path";

const envFile = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    process.env[key] = val;
  }
}

const key = process.env.GEMINI_API_KEY;
console.log("Testing GEMINI_API_KEY:", key ? `${key.slice(0, 8)}...` : "NONE");

async function testModel(modelName: string) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }],
        }),
      }
    );
    console.log(`Model ${modelName}: status ${res.status}`);
    if (!res.ok) {
      const text = await res.text();
      console.log(`  Error body:`, text.slice(0, 200));
    } else {
      const data = await res.json();
      console.log(`  Success! Response snippet:`, JSON.stringify(data).slice(0, 150));
    }
  } catch (err) {
    console.error(`Model ${modelName} fetch error:`, err);
  }
}

async function main() {
  await testModel("gemini-2.5-flash");
  await testModel("gemini-1.5-flash");
  await testModel("gemini-1.5-pro");
  await testModel("gemini-2.0-flash-exp");
}

main().catch(console.error);
