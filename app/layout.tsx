import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { getAvatarEmoji } from "@/lib/profile/avatars";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Learning Map — AI-Powered Personalized Roadmaps",
  description: "Curate your perfect learning path from zero to expert with AI-driven milestones, budget-aware YouTube/Web resources, and progress tracking.",
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

  let profile: { avatar_id?: string } | null = null;
  if (user) {
    const { data: pData, error: pErr } = await supabase
      .from("profiles")
      .select("avatar_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!pErr) profile = pData;
  }

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 glass-header">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="group flex items-center gap-2.5 font-serif text-xl font-bold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-lg shadow-lg shadow-indigo-500/25 transition group-hover:scale-105">
                🗺️
              </span>
              <span className="text-white transition group-hover:text-indigo-300">
                Learning<span className="gradient-text">Map</span>
              </span>
            </Link>

            <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
              <Link
                href="/onboarding"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 transition hover:bg-slate-800/60 hover:text-white"
              >
                <span>✨</span> Generate Path
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-3 py-1.5 rounded-lg text-slate-300 transition hover:bg-slate-800/60 hover:text-white"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200 transition hover:border-indigo-500/50 hover:bg-slate-800"
                    title="Account Settings"
                  >
                    <span className="text-lg leading-none">{getAvatarEmoji(profile?.avatar_id)}</span>
                    <span className="hidden sm:inline">Settings</span>
                  </Link>
                  <form action={logout}>
                    <button className="px-3 py-1.5 rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 rounded-lg text-slate-300 transition hover:bg-slate-800/60 hover:text-white"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-primary rounded-lg px-4 py-2 text-sm shadow-md"
                  >
                    Sign up free
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
