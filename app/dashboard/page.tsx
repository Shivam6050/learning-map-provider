import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectedFrom=/dashboard");
  }

  // Reading our own profile row proves the RLS policy
  // "profiles_select_own_or_admin" is working, not just that
  // auth.getUser() works.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role, created_at")
    .eq("id", user?.id)
    .single();

  const { data: paths } = await supabase
    .from("learning_paths")
    .select("id, skill_level, status, created_at, fields(name)")
    .order("created_at", { ascending: false });

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

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-500">Your learning paths</h2>
        <Link
          href="/onboarding"
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Generate a new path
        </Link>
      </div>

      {paths?.length ? (
        <ul className="mt-3 space-y-2">
          {paths.map((path: any) => {
            const field = Array.isArray(path.fields) ? path.fields[0] : path.fields;
            return (
              <li key={path.id}>
                <Link
                  href={`/paths/${path.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 text-sm hover:border-indigo-300"
                >
                  <span className="font-medium text-slate-900">{field?.name}</span>
                  <span className="ml-2 text-slate-500">
                    {path.skill_level} · {path.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          No paths yet — generate your first one above.
        </p>
      )}

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
