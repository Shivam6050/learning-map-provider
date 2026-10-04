import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), assurance: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser, mfa: { getAuthenticatorAssuranceLevel: mocks.assurance } }, from: mocks.from }) }));
import { getRenderContext, getRenderProfile } from "./render-context";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
});

it("preserves the server-verified authentication result", async () => {
  const auth = { data: { user: { id: "owner" } }, error: null };
  mocks.getUser.mockResolvedValue(auth);
  expect((await getRenderContext()).auth).toBe(auth);
  expect(mocks.getUser).toHaveBeenCalledOnce();
});

it("does not query profiles for an unauthenticated request", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  expect(await getRenderProfile()).toEqual({ data: null, error: null });
  expect(mocks.from).not.toHaveBeenCalled();
});

it("uses the verified user's id and preserves profile database errors", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "verified-owner" } }, error: null });
  const result = { data: null, error: { message: "database unavailable" } };
  mocks.maybeSingle.mockResolvedValue(result);
  expect(await getRenderProfile()).toBe(result);
  expect(mocks.eq).toHaveBeenCalledWith("id", "verified-owner");
  expect(mocks.select).toHaveBeenCalledWith("avatar_id, display_name");
});


it("hides profile data from enrolled accounts before the MFA challenge", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "owner", factors: [{status:"verified"}] } }, error:null });
  mocks.assurance.mockResolvedValue({data:{currentLevel:"aal1"},error:null});
  expect((await getRenderContext()).mfaRequired).toBe(true);
  expect(await getRenderProfile()).toEqual({data:null,error:null});
  expect(mocks.from).not.toHaveBeenCalled();
});

it("permits the owner's profile after MFA verification", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "owner", factors: [{status:"verified"}] } }, error:null });
  mocks.assurance.mockResolvedValue({data:{currentLevel:"aal2"},error:null});
  const result={data:{display_name:"Owner"},error:null};
  mocks.maybeSingle.mockResolvedValue(result);
  expect((await getRenderContext()).mfaRequired).toBe(false);
  expect(await getRenderProfile()).toBe(result);
  expect(mocks.eq).toHaveBeenCalledWith("id","owner");
});
