import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), send: vi.fn(), configured: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: mocks.client }));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.send, emailDeliveryConfigured: mocks.configured }));
import { GET } from "./route";
const request = () => new Request("https://example.com/api/cron/weekly-reminders", { headers: { authorization: "Bearer test-secret" } });
const eligible = () => ({ id: "path", user_id: "user", created_at: "2020-01-01", fields: { name: "React" }, stages: [{ stage_progress: [] }] });
beforeEach(() => {
  vi.stubEnv("CRON_SECRET", "test-secret"); mocks.configured.mockReturnValue(true); mocks.send.mockResolvedValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.resetAllMocks(); });
function setup(paths: unknown[] = []) {
  const state = {
    checkpoint: null as { last_path_id?: string; completed: boolean } | null,
    checkpointReadError: false, checkpointWriteError: false, candidateError: false,
    deliveryWriteError: false, missingDelivery: false, summaryError: false, nullCount: false,
    recipientError: false, claimError: false, optedOut: false,
    ledger: new Map<string, string>(),
  };
  const error = { message: "private provider details test@example.com", code: "FAIL" };
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), abortSignal: vi.fn(async () => ({ data: paths, error: state.candidateError ? error : null })) };
  const checkpoint = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockReturnThis(), maybeSingle: vi.fn(async () => ({ data: state.checkpoint, error: state.checkpointReadError ? error : null })) };
  const rpcQuery = { abortSignal: vi.fn(async () => ({ error: state.checkpointWriteError ? error : null })) };
  const rpc = vi.fn(() => rpcQuery);
  const deliveryQueries: { eq: ReturnType<typeof vi.fn>; neq: ReturnType<typeof vi.fn> }[] = [];
  function delivery() {
    let mode = "summary", status = "", user = "";
    async function execute() {
        if (mode === "claim") {
          if (state.claimError) return { error };
          if (state.ledger.has(user)) return { error: { code: "23505" } };
          state.ledger.set(user, "claimed"); return { error: null };
        }
        if (mode === "update") {
          if (state.deliveryWriteError) return { error, data: null };
          if (state.missingDelivery) return { error: null, data: null };
          state.ledger.set(user, status); return { error: null, data: { status } };
        }
        return { count: state.nullCount ? null : [...state.ledger.values()].filter(value => value !== "sent").length, error: state.summaryError ? error : null };
    }
    const result = {
      insert: vi.fn((value: { user_id: string }) => { mode = "claim"; user = value.user_id; return result; }),
      update: vi.fn((value: { status: string }) => { mode = "update"; status = value.status; return result; }),
      select: vi.fn().mockImplementation(() => result),
      eq: vi.fn((key: string, value: string) => { if (key === "user_id") user = value; return result; }),
      neq: vi.fn().mockImplementation(() => result),
      maybeSingle: vi.fn().mockImplementation(() => result),
      abortSignal: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) => execute().then(resolve),
    };
    deliveryQueries.push(result); return result;
  }
  const client = { rpc, from: vi.fn((table: string) => table === "learning_paths" ? query : table === "reminder_scan_cursor" ? checkpoint : delivery()), auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: { email: "test@example.com", email_confirmed_at: "2026-01-01", user_metadata: { weekly_reminders: !state.optedOut } } }, error: state.recipientError ? error : null })) } } };
  mocks.client.mockReturnValue(client);
  return { state, client, query, deliveryQueries };
}
it("rejects unauthorized requests before querying users", async () => {
  const response = await GET(new Request("https://example.com"));
  expect(response.status).toBe(401); expect(response.headers.get("cache-control")).toContain("no-store"); expect(mocks.client).not.toHaveBeenCalled();
});
it("rejects a missing cron secret even with an empty bearer", async () => {
  vi.stubEnv("CRON_SECRET", ""); expect((await GET(request())).status).toBe(401); expect(mocks.client).not.toHaveBeenCalled();
});
it("reports missing email configuration without sending", async () => {
  mocks.configured.mockReturnValue(false); const response = await GET(request());
  expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ reason: "email_not_configured" }); expect(mocks.send).not.toHaveBeenCalled();
});
it("reports a fully scanned empty batch as complete", async () => {
  setup(); const response = await GET(request()); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ incomplete: false, sent: 0, outstanding: 0 });
});
it("reports timeout between full batches instead of false success", async () => {
  let now = Date.parse("2026-10-01"); vi.spyOn(Date, "now").mockImplementation(() => now);
  const paths = Array.from({ length: 100 }, () => ({ id: "path", stages: [] }));
  Object.defineProperty(paths[99], "stages", { get() { now += 46000; return []; } });
  setup(paths); const response = await GET(request()); expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ incomplete: true, reason: "time_budget" });
});
it("reports uncertain delivery without retrying the email", async () => {
  const { state } = setup([eligible()]); mocks.send.mockResolvedValue(false);
  const response = await GET(request()); expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ sent: 0, claimed: 1, uncertain: 1, outstanding: 1, incomplete: false });
  expect(state.ledger.get("user")).toBe("uncertain"); expect(mocks.send).toHaveBeenCalledTimes(1);
});
it("resumes after the persisted cursor", async () => {
  const { query, client, state } = setup(); state.checkpoint = { last_path_id: "previous", completed: false };
  expect((await GET(request())).status).toBe(200); expect(query.gt).toHaveBeenCalledWith("id", "previous");
  expect(client.rpc).toHaveBeenCalledWith("advance_reminder_scan", expect.objectContaining({ p_path: "previous", p_completed: true }));
});
it("does not rescan a completed week but checks its delivery ledger", async () => {
  const { query, state, deliveryQueries } = setup(); state.checkpoint = { completed: true };
  expect((await GET(request())).status).toBe(200); expect(query.abortSignal).not.toHaveBeenCalled();
  expect(deliveryQueries[0].neq).toHaveBeenCalledWith("status", "sent");
  expect(deliveryQueries[0].eq).toHaveBeenCalledWith("period", expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
});
it.each(["claimed", "uncertain"])("keeps %s deliveries visible after scan completion without resending", async status => {
  const { state } = setup(); state.checkpoint = { completed: true }; state.ledger.set("user", status);
  const response = await GET(request()); expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ outstanding: 1, incomplete: false, reason: "delivery_unresolved" }); expect(mocks.send).not.toHaveBeenCalled();
});
it("checkpoints skipped paths without sending", async () => {
  const { client } = setup([{ id: "skipped", stages: [] }]); await GET(request());
  expect(client.rpc).toHaveBeenCalledWith("advance_reminder_scan", expect.objectContaining({ p_path: "skipped", p_completed: false })); expect(mocks.send).not.toHaveBeenCalled();
});
it("never reports success when the provider accepts but saving delivery status fails", async () => {
  const { state, client } = setup([eligible()]); state.deliveryWriteError = true;
  const response = await GET(request()); expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ sent: 1, claimed: 1, incomplete: true, reason: "delivery_status_write" });
  expect(client.rpc).not.toHaveBeenCalled(); expect(state.ledger.get("user")).toBe("claimed");
  state.deliveryWriteError = false;
  const retry = await GET(request()); expect(retry.status).toBe(503); expect(await retry.json()).toMatchObject({ outstanding: 1 }); expect(mocks.send).toHaveBeenCalledTimes(1);
});
it("fails if updating the delivery record silently affects no row", async () => {
  const { state } = setup([eligible()]); state.missingDelivery = true;
  const response = await GET(request()); expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ reason: "delivery_status_write" });
});
it("handles final checkpoint failures as a structured retryable response", async () => {
  const { state } = setup(); state.checkpointWriteError = true;
  const response = await GET(request()); expect(response.status).toBe(503); expect(await response.json()).toMatchObject({ incomplete: true, reason: "checkpoint_write" });
});
it.each(["checkpointReadError", "candidateError", "summaryError", "nullCount"] as const)("fails closed for %s", async flag => {
  const { state } = setup(); state[flag] = true; expect((await GET(request())).status).toBe(503);
});
it("returns a sanitized failure if client initialization throws", async () => {
  mocks.client.mockImplementation(() => { throw new Error("private-token test@example.com"); });
  const response = await GET(request()); expect(response.status).toBe(503); expect(await response.text()).not.toMatch(/private-token|test@example/);
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(/private-token|test@example/);
});
it("preserves opt-out and claim deduplication", async () => {
  const { state } = setup([eligible()]); state.optedOut = true;
  expect((await GET(request())).status).toBe(200); expect(mocks.send).not.toHaveBeenCalled();
  state.optedOut = false; state.ledger.set("user", "sent");
  expect((await GET(request())).status).toBe(200); expect(mocks.send).not.toHaveBeenCalled();
});
it("sends once across overlapping runs competing for the same delivery claim", async () => {
  setup([eligible()]); await Promise.all([GET(request()), GET(request())]); expect(mocks.send).toHaveBeenCalledTimes(1);
});
it("records provider acceptance and healthy completion without exposing contacts in logs", async () => {
  setup([eligible()]); const response = await GET(request()); expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ sent: 1, claimed: 1, outstanding: 0, incomplete: false });
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("test@example.com");
});

it("preserves the sent claim when checkpointing after sending fails", async () => {
  const { state } = setup([eligible()]); state.checkpointWriteError = true;
  const response = await GET(request()); expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ sent: 1, reason: "checkpoint_write", incomplete: true });
  expect(state.ledger.get("user")).toBe("sent");
  state.checkpointWriteError = false;
  expect((await GET(request())).status).toBe(200); expect(mocks.send).toHaveBeenCalledTimes(1);
});
