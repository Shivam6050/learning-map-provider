import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Learning Map",
  description: "A personalized learning path for whatever you want to learn next.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="font-serif text-lg text-slate-900">
              Learning Map
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                    Dashboard
                  </Link>
                  <form action={logout}>
                    <button className="text-slate-600 hover:text-slate-900">Log out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-slate-600 hover:text-slate-900">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
