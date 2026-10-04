import "server-only";
import { createHash } from "node:crypto";

export type PasswordScreen = "safe" | "breached" | "unavailable";
/** Check only completed passwords. No password, full hash or email leaves this server. */
export async function screenPassword(password: string): Promise<PasswordScreen> {
  if (password.length < 8 || password.length > 128) return "unavailable";
  const hash = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  try {
    const response = await fetch("https://api.pwnedpasswords.com/range/" + hash.slice(0, 5), {
      headers: {"Add-Padding": "true", "User-Agent": "LearningMap-Password-Screen/1.0"},
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(4000),
    });
    if (!response.ok || !response.body) return "unavailable";
    // Bound memory even if the upstream response is malformed.
    const reader = response.body.getReader();
    const decoder = new TextDecoder(); let body = "", bytes = 0;
    try {
      while (true) {
        const {value, done} = await reader.read(); if (done) break;
        bytes += value.byteLength;
        if (bytes > 131072) { await reader.cancel(); return "unavailable"; }
        body += decoder.decode(value, {stream:true});
      }
      body += decoder.decode();
    } finally { reader.releaseLock(); }
    const lines = body.trim().split(/\r?\n/);
    if (!lines.length || lines.some(line => !/^[0-9A-F]{35}:\d+$/.test(line))) return "unavailable";
    return lines.some(line => line.slice(0,35) === hash.slice(5) && Number(line.slice(36)) > 0) ? "breached" : "safe";
  } catch { return "unavailable"; } // Never log credentials, prefixes or provider response bodies.
}
export function passwordScreenMessage(result: Exclude<PasswordScreen,"safe">) {
  return result === "breached"
    ? "This password appears in a known data breach. Choose a different, unique password."
    : "Password safety checking is temporarily unavailable. Please try again shortly.";
}
