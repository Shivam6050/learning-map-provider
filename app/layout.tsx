import { BrandLogo } from "@/components/BrandLogo";
import { cookies } from "next/headers";
import { CurrencyProvider, CurrencySwitcher } from "@/components/CurrencyProvider";
import { CURRENCIES, CURRENCY_COOKIE, isCurrency } from "@/lib/currency/format";
import { getConversionRate } from "@/lib/currency/convert";
import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { getAvatarEmoji } from "@/lib/profile/avatars";
import { Footer } from "@/components/Footer";
import { NavbarNav } from "@/components/NavbarNav";

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
  const savedCurrency = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const initialCurrency = isCurrency(savedCurrency) ? savedCurrency : null;
  const rateEntries = await Promise.all(CURRENCIES.flatMap(from => CURRENCIES.map(async to => [`${from}:${to}`, await getConversionRate(from, to).catch(() => null)] as const)));
  const rates = Object.fromEntries(rateEntries);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { avatar_id?: string; display_name?: string } | null = null;
  if (user) {
    const { data: pData, error: pErr } = await supabase
      .from("profiles")
      .select("avatar_id, display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (!pErr) profile = pData;
  }

  const effectiveAvatarId = profile?.avatar_id ?? (user?.user_metadata?.avatar_id as string | undefined);

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}>
      <head>
        <meta name="impact-site-verification" content="105c3802-b4bb-4386-a33c-46865d7825a5" {...{ value: "105c3802-b4bb-4386-a33c-46865d7825a5" }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        <CurrencyProvider initialCurrency={initialCurrency} rates={rates}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 glass-header">
          <div className="mx-auto flex min-h-16 flex-wrap gap-y-3 max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" aria-label="LearningMap home" className="inline-flex shrink-0 items-center rounded-md">
              <BrandLogo />
            </Link>

            <CurrencySwitcher />
            <NavbarNav user={user} avatarId={effectiveAvatarId} displayName={profile?.display_name?.trim() || user?.user_metadata?.display_name?.trim() || "Learner"} />
          </div>
        </header>

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <Footer />
        </CurrencyProvider>
      </body>
    </html>
  );
}
