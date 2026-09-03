import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { approveTrustedSource, rejectTrustedSource } from "@/app/admin/trusted-sources/actions";
import { isSafeHttpUrl } from "@/lib/link-check/url-safety";

export default async function TrustedSourcesAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16 bg-slate-950 text-slate-100 bg-grid-pattern">
        <div className="glass-card max-w-lg rounded-3xl p-8 text-center border-slate-800 shadow-2xl">
          <span className="text-4xl">🔒</span>
          <h1 className="mt-3 font-serif text-2xl font-bold text-white">Not Authorized</h1>
          <p className="mt-2 text-sm text-slate-400">
            This page is for administrators only. To access this dashboard, an existing admin must set your <code className="text-indigo-400 font-mono">role</code> to <code className="text-indigo-400 font-mono">admin</code> in the profiles table.
          </p>
        </div>
      </div>
    );
  }

  const { data: pending } = await supabase
    .from("trusted_sources")
    .select("id, source_name, source_url, platform, added_by, field_id, fields(name)")
    .eq("approved", false)
    .order("source_name");

  const { data: approved } = await supabase
    .from("trusted_sources")
    .select("id, source_name, source_url, platform, fields(name)")
    .eq("approved", true)
    .order("source_name")
    .limit(50);

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 bg-grid-pattern py-12">
      <div className="glow-orb-indigo top-10 left-1/3" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="glass-card rounded-3xl p-6 sm:p-8 border-slate-800 shadow-2xl">
          <h1 className="font-serif text-3xl font-bold text-white">Trusted Sources Admin</h1>
          <p className="mt-2 text-xs text-slate-400">
            Publishers proposed by real resource discovery runs. Approving a source grants allowlist trust for future Gemini resource evaluations.
          </p>

          <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-amber-400">
            Pending Approval ({pending?.length ?? 0})
          </h2>

          {pending?.length ? (
            <ul className="mt-4 space-y-3">
              {pending.map((source: any) => {
                const field = Array.isArray(source.fields) ? source.fields[0] : source.fields;
                return (
                  <li
                    key={source.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm"
                  >
                    <div>
                      {isSafeHttpUrl(source.source_url) ? (
                        <a
                          href={source.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-indigo-400 transition hover:text-indigo-300 hover:underline"
                        >
                          {source.source_name} ↗
                        </a>
                      ) : (
                        <span className="font-semibold text-slate-300">{source.source_name}</span>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        Platform: {source.platform} · Domain: {field?.name} · Proposed by: {source.added_by || "System"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <form action={approveTrustedSource}>
                        <input type="hidden" name="id" value={source.id} />
                        <button
                          type="submit"
                          className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 shadow-md"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={rejectTrustedSource}>
                        <input type="hidden" name="id" value={source.id} />
                        <button
                          type="submit"
                          className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No sources pending review right now.</p>
          )}

          <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-emerald-400">
            Approved Sources ({approved?.length ?? 0})
          </h2>
          {approved?.length ? (
            <ul className="mt-4 space-y-2">
              {approved.map((source: any) => {
                const field = Array.isArray(source.fields) ? source.fields[0] : source.fields;
                return (
                  <li key={source.id} className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-2 text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-medium text-white">{source.source_name}</span>
                    <span className="text-slate-500">
                      {source.platform} · {field?.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No sources approved yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
