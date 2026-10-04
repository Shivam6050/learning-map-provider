// Run after deploying server-only credentials and retiring ALL exposed project keys.
// No users, email/SMS messages, or password changes are created by this check.
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !key?.startsWith("sb_publishable_")) {
  console.error("Set the server-only project URL and publishable key in private .env first.");
  process.exit(1);
}
const jwt = process.env.AUTH_BOUNDARY_USER_JWT;
const retired = process.env.AUTH_BOUNDARY_RETIRED_KEY;
const headers = jwt ? {Authorization: `Bearer ${jwt}`} : {};
const probes = [["missing key", headers], ["invalid key", {...headers, apikey: "sb_publishable_invalid"}]];
if (jwt) probes.push(["user JWT as API key", {...headers, apikey: jwt}]);
if (retired) probes.push(["retired API key", {...headers, apikey: retired}]);
let failed = false;
for (const [label, credentials] of probes) {
  for (const path of ["/auth/v1/user", "/auth/v1/signup", "/auth/v1/verify/../signup", "/auth/v1/verify%2F..%2Fsignup", "/auth/v1/authorize/../signup", "/auth/v1/callback/../signup"]) {
    const signup = path.includes("signup");
    try {
      const response = await fetch(new URL(path, url), {
        method: signup ? "POST" : "GET", redirect: "manual", signal: AbortSignal.timeout(15000),
        headers: {...credentials, ...(signup ? {"Content-Type": "application/json"} : {})},
        // An invalid email and no password cannot create a user even if the gate is open.
        ...(signup ? {body: JSON.stringify({email: "not-an-email"})} : {}),
      });
      await response.arrayBuffer();
      const blocked = [401, 403, 404].includes(response.status);
      console.log(`${blocked ? "PASS" : "FAIL"}: ${label}, ${path}, HTTP ${response.status}`);
      if (!blocked) failed = true;
    } catch {
      console.log(`UNKNOWN: ${label}, ${path}; network check failed`); failed = true;
    }
  }
}
try {
  const response = await fetch(new URL("/auth/v1/settings", url), {headers: {apikey: key}, signal: AbortSignal.timeout(15000)});
  await response.arrayBuffer();
  console.log(`${response.ok ? "PASS" : "FAIL"}: configured server application key, HTTP ${response.status}`);
  if (!response.ok) failed = true;
} catch { console.log("UNKNOWN: server credential control; network check failed"); failed = true; }
if (!jwt || !retired) console.log("INCOMPLETE: provide a synthetic user JWT and a retired key for the additional substitution/retirement checks.");
process.exitCode = failed || !jwt || !retired ? 1 : 0;
