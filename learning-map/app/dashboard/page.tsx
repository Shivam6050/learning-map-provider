import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Reading our own profile row proves the RLS policy
  // "profiles_select_own_or_admin" is working, not just that
  // auth.getUser() works.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, created_at")
    .eq("id", user?.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-2xl text-slate-900">
        Logged in as {user?.email}
      </h1>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">Profile row (via RLS)</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Display name</dt>
            <dd className="text-slate-900">{profile?.display_name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Role</dt>
            <dd className="text-slate-900">{profile?.role ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Profile created</dt>
            <dd className="text-slate-900">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleString()
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        This page only renders for a logged-in user, and the profile data
        above only loaded because the <code>profiles_select_own_or_admin</code>{" "}
        RLS policy allowed it. That&apos;s the Phase 0 exit check: auth,
        RLS, and deploy all working together.
      </p>

      <form action={logout} className="mt-8">
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
