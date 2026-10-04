// Run after deploying server-only credentials and retiring ALL exposed project keys.
// Malformed bodies ensure these probes cannot create users or change passwords.
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !key?.startsWith("sb_publishable_")) {
  console.error("Set the server-only project URL and publishable key in private .env first.");
  process.exit(1);
}
const jwt = process.env.AUTH_BOUNDARY_USER_JWT;
const retired = process.env.AUTH_BOUNDARY_RETIRED_KEY;
let retiredKeys;
try {
  retiredKeys = process.env.AUTH_BOUNDARY_RETIRED_KEYS ? JSON.parse(process.env.AUTH_BOUNDARY_RETIRED_KEYS) : retired ? [retired] : [];
  if (!Array.isArray(retiredKeys) || retiredKeys.some(value => typeof value !== "string" || !value)) throw new Error();
} catch {
  console.error("AUTH_BOUNDARY_RETIRED_KEYS must be a private JSON array of retired key values.");
  process.exit(1);
}
const headers = jwt ? {Authorization: `Bearer ${jwt}`} : {};
const probes = [["missing key", headers], ["invalid key", {...headers, apikey: "sb_publishable_invalid"}]];
if (jwt) {
  probes.push(["user JWT as API key", {...headers, apikey: jwt}]);
  probes.push(["user JWT as query API key", headers, jwt]);
}
retiredKeys.forEach((value, index) => {
  probes.push([`retired API key ${index + 1}`, {...headers, apikey: value}]);
  probes.push([`retired query API key ${index + 1}`, headers, value]);
  if (value.startsWith("eyJ")) probes.push([`retired legacy bearer ${index + 1}`, {Authorization: `Bearer ${value}`}]);
});
const requests = [
  ["GET", "/auth/v1/user"],
  // Invalid JSON fails before any update, even with a valid user session.
  ["PUT", "/auth/v1/user", "{"],
  ...["/auth/v1/signup", "/auth/v1/verify%2F..%2Fsignup", "/auth/v1/authorize%2F..%2Fsignup", "/auth/v1/callback%2F..%2Fsignup"].map(path => ["POST", path, JSON.stringify({email: "not-an-email"})]),
];
let failed = false;
for (const [label, credentials, queryKey] of probes) {
  for (const [method, path, body] of requests) {
    try {
      const target = new URL(path, url);
      if (queryKey) target.searchParams.set("apikey", queryKey);
      const response = await fetch(target, {
        method, redirect: "manual", signal: AbortSignal.timeout(15000),
        headers: {...credentials, ...(body ? {"Content-Type": "application/json"} : {})},
        ...(body ? {body} : {}),
      });
      await response.arrayBuffer();
      const blocked = [401, 403, 404].includes(response.status);
      console.log(`${blocked ? "PASS" : "FAIL"}: ${label}, ${method} ${path}, HTTP ${response.status}`);
      if (!blocked) failed = true;
    } catch {
      console.log(`UNKNOWN: ${label}, ${method} ${path}; network check failed`); failed = true;
    }
  }
}
for (const [label, path, credentials] of [
  ["configured server application key", "/auth/v1/settings", {apikey: key}],
  ...(jwt ? [["synthetic user session control", "/auth/v1/user", {apikey: key, Authorization: `Bearer ${jwt}`}]] : []),
]) {
  try {
    const response = await fetch(new URL(path, url), {headers: credentials, signal: AbortSignal.timeout(15000)});
    await response.arrayBuffer();
    console.log(`${response.ok ? "PASS" : "FAIL"}: ${label}, HTTP ${response.status}`);
    if (!response.ok) failed = true;
  } catch { console.log(`UNKNOWN: ${label}; network check failed`); failed = true; }
}
if (!jwt || !retiredKeys.length) console.log("INCOMPLETE: provide a synthetic user JWT and all retired keys for substitution/retirement checks.");
process.exitCode = failed || !jwt || !retiredKeys.length ? 1 : 0;
