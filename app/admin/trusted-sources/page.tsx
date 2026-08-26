import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { approveTrustedSource, rejectTrustedSource } from "@/app/admin/trusted-sources/actions";

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
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-xl text-slate-900">Not authorized</h1>
        <p className="mt-2 text-sm text-slate-500">
          This page is for admins only. If you should have access, an existing admin needs
          to set your <code>role</code> to <code>admin</code> in the <code>profiles</code> table.
        </p>
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
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-2xl text-slate-900">Trusted Sources</h1>
      <p className="mt-1 text-sm text-slate-500">
        Publishers proposed by real discovery runs. Approving one means every resource from
        it counts as trusted in judgment going forward.
      </p>

      <h2 className="mt-8 text-sm font-semibold text-slate-700">
        Pending ({pending?.length ?? 0})
      </h2>
      {pending?.length ? (
        <ul className="mt-3 space-y-2">
          {pending.map((source: any) => {
            const field = Array.isArray(source.fields) ? source.fields[0] : source.fields;
            return (
              <li
                key={source.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm"
              >
                <div>
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {source.source_name}
                  </a>
                  <p className="text-xs text-slate-400">
                    {source.platform} · {field?.name} · proposed by {source.added_by}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={approveTrustedSource}>
                    <input type="hidden" name="id" value={source.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectTrustedSource}>
                    <input type="hidden" name="id" value={source.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
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
        <p className="mt-3 text-sm text-slate-400">Nothing pending review right now.</p>
      )}

      <h2 className="mt-10 text-sm font-semibold text-slate-700">
        Approved ({approved?.length ?? 0})
      </h2>
      {approved?.length ? (
        <ul className="mt-3 space-y-1">
          {approved.map((source: any) => {
            const field = Array.isArray(source.fields) ? source.fields[0] : source.fields;
            return (
              <li key={source.id} className="text-sm text-slate-600">
                {source.source_name}{" "}
                <span className="text-xs text-slate-400">
                  ({source.platform} · {field?.name})
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">None approved yet.</p>
      )}
    </div>
  );
}
