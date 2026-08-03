import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24">
      <h1 className="font-serif text-4xl text-slate-900">
        Learn anything, with a map that fits you.
      </h1>
      <p className="mt-4 max-w-xl text-slate-600">
        Tell us what you want to learn, your level, and your budget. We
        curate a personalized path from across the web, not a generic
        roadmap.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
