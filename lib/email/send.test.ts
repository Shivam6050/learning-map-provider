import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { emailDeliveryConfigured, sendEmail } from "./send";
beforeEach(() => { vi.stubEnv("EMAIL_PROVIDER", "resend"); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("requires a dedicated sender instead of silently using the Resend test domain", async () => {
  vi.stubEnv("RESEND_API_KEY", "test-key");
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  for (const sender of ["", "invalid", "LearningMap <onboarding@resend.dev>"]) {
    vi.stubEnv("EMAIL_FROM_ADDRESS", sender);
    expect(emailDeliveryConfigured()).toBe(false);
    expect(await sendEmail({to:"learner@example.com",subject:"Test",html:"test"})).toBe(false);
  }
  expect(fetchMock).not.toHaveBeenCalled();
});
it("preserves the configured sender and retry idempotency key", async () => {
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("EMAIL_FROM_ADDRESS", "LearningMap <hello@example.com>");
  const fetchMock = vi.fn().mockResolvedValue({ok:true}); vi.stubGlobal("fetch", fetchMock);
  expect(await sendEmail({to:"learner@example.com",subject:"Test",html:"test",idempotencyKey:"weekly/1"})).toBe(true);
  const options=fetchMock.mock.calls[0][1];
  expect(options.headers["Idempotency-Key"]).toBe("weekly/1");
  expect(JSON.parse(options.body).from).toBe("LearningMap <hello@example.com>");
});

it("uses Brevo with a verified free-mail sender without exposing keys in the payload", async () => {
  vi.stubEnv("EMAIL_PROVIDER", "brevo");vi.stubEnv("BREVO_API_KEY", "brevo-test");
  vi.stubEnv("EMAIL_FROM_ADDRESS", "LearningMap <owner@gmail.com>");
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({messageId:"accepted"})});vi.stubGlobal("fetch",fetchMock);
  expect(await sendEmail({to:"learner@example.com",subject:"Continue learning",html:"test"})).toBe(true);
  const [url,options]=fetchMock.mock.calls[0];
  expect(url).toBe("https://api.brevo.com/v3/smtp/email");
  expect(options.headers["api-key"]).toBe("brevo-test");
  expect(options.headers.Authorization).toBeUndefined();
  expect(JSON.parse(options.body)).toMatchObject({sender:{name:"LearningMap",email:"owner@gmail.com"},to:[{email:"learner@example.com"}],htmlContent:"test"});
  expect(options.body).not.toContain("brevo-test");
});
it("does not switch providers when Brevo rejects a send", async () => {
  vi.stubEnv("EMAIL_PROVIDER","brevo");vi.stubEnv("BREVO_API_KEY","test");vi.stubEnv("RESEND_API_KEY","also-present");
  vi.stubEnv("EMAIL_FROM_ADDRESS","owner@gmail.com");
  vi.spyOn(console,"error").mockImplementation(()=>{});
  const fetchMock=vi.fn().mockResolvedValue({ok:false,status:429});vi.stubGlobal("fetch",fetchMock);
  expect(await sendEmail({to:"learner@example.com",subject:"Test",html:"test"})).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("rejects unknown providers and missing selected-provider credentials",()=>{
  vi.stubEnv("EMAIL_FROM_ADDRESS","owner@gmail.com");vi.stubEnv("EMAIL_PROVIDER","brevo");vi.stubEnv("BREVO_API_KEY","");
  expect(emailDeliveryConfigured()).toBe(false);
  vi.stubEnv("EMAIL_PROVIDER","typo");expect(emailDeliveryConfigured()).toBe(false);
});
