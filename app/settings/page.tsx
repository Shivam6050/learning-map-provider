import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/settings/actions";
import { AVATAR_OPTIONS } from "@/lib/profile/avatars";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectedFrom=/settings");

  let profile: { display_name?: string; avatar_id?: string } | null = null;
  const { data: pData, error: pErr } = await supabase
    .from("profiles")
    .select("display_name, avatar_id")
    .eq("id", user.id)
    .maybeSingle();

  if (pErr && pErr.message.includes("avatar_id")) {
    const { data: fallbackP } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    profile = fallbackP;
  } else {
    profile = pData;
  }

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16 bg-slate-950 text-slate-100 bg-grid-pattern">
      <div className="glow-orb-indigo top-10 left-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 border-slate-800 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
                Account Settings
              </h1>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
        </div>

        {params.saved && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300 backdrop-blur-md" aria-live="polite">
            ✅ Settings updated successfully.
          </div>
        )}
        {params.error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300 backdrop-blur-md" role="alert">
            ⚠️ {params.error}
          </div>
        )}

        <form action={updateProfile} className="space-y-5">
          <div>
            <label htmlFor="displayName" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Display Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              maxLength={100}
              defaultValue={profile?.display_name ?? ""}
              className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Companion Avatar
            </span>
            <p className="mt-1 text-xs text-slate-400">
              Pick the avatar that walks your roadmaps with you.
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2.5">
              {AVATAR_OPTIONS.map((avatar) => (
                <label key={avatar.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="avatarId"
                    value={avatar.id}
                    defaultChecked={profile?.avatar_id === avatar.id}
                    required
                    className="peer sr-only"
                  />
                  <span className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 text-2xl transition peer-checked:border-indigo-500 peer-checked:bg-indigo-500/10 peer-checked:ring-2 peer-checked:ring-indigo-500/30 hover:border-slate-700">
                    {avatar.emoji}
                    <span className="text-[10px] font-semibold text-slate-400">{avatar.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          >
            Save Profile Changes
          </button>
        </form>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-red-400">
            Danger Zone
          </h2>
          <p className="text-xs text-slate-400">
            Permanently delete your account, saved roadmaps, and progress history.
          </p>
          <DeleteAccountForm />
        </div>
      </div>
    </div>
  );
}
