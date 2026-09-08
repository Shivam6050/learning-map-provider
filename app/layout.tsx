import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { getAvatarEmoji } from "@/lib/profile/avatars";
import { Footer } from "@/components/Footer";
import { NavbarNav } from "@/components/NavbarNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Learning Map — AI-Powered Personalized Roadmaps",
  description: "Curate your perfect learning path from zero to expert with AI-driven milestones, budget-aware YouTube/Web resources, and progress tracking.",
  other: {
    "impact-site-verification": "105c3802-b4bb-4386-a33c-46865d7825a5",
  },
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

  const effectiveAvatarId = profile?.avatar_id ?? (user?.user_metadata?.avatar_id as string | undefined);

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}>
      <head>
        <meta name="impact-site-verification" content="105c3802-b4bb-4386-a33c-46865d7825a5" />
        <span dangerouslySetInnerHTML={{ __html: '<meta name="impact-site-verification" value="105c3802-b4bb-4386-a33c-46865d7825a5" />' }} />
      </head>
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

            <NavbarNav user={user} avatarEmoji={getAvatarEmoji(effectiveAvatarId)} />
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
