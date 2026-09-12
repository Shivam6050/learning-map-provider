"use client";

import { GeneratePathIcon } from "@/components/GeneratePathIcon";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";


import { AccountMenu } from "@/components/AccountMenu";

export function NavbarNav({
  user,
  avatarId,
  displayName = "Learner",
}: {
  user: any;
  avatarId?: string;
  displayName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [navigatingPath, setNavigatingPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset navigating state when pathname changes
  useEffect(() => {
    setNavigatingPath(null);
  }, [pathname]);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (pathname === href) return;
    setNavigatingPath(href);
    e.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <nav aria-label="Main navigation" className="flex w-full sm:w-auto items-center gap-2 sm:gap-4 text-sm font-medium">
      <Link
        href="/onboarding"
        onClick={(e) => handleNavClick(e, "/onboarding")}
        className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 transition-all duration-200 active:scale-95 cursor-pointer ${
          navigatingPath === "/onboarding"
            ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
            : "hover:bg-slate-800/60 hover:text-white"
        }`}
      >
        {navigatingPath === "/onboarding" ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <GeneratePathIcon /> Generate Path
          </>
        )}
      </Link>

      {user ? (
        <>
          <Link
            href="/dashboard"
            onClick={(e) => handleNavClick(e, "/dashboard")}
            className={`px-3 py-1.5 rounded-lg text-slate-300 transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              navigatingPath === "/dashboard"
                ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                : "hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            {navigatingPath === "/dashboard" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                <span>Dashboard...</span>
              </>
            ) : (
              "Dashboard"
            )}
          </Link>

          <AccountMenu avatarId={avatarId} displayName={displayName} />
        </>
      ) : (
        <>
          <Link
            href="/login"
            onClick={(e) => handleNavClick(e, "/login")}
            className={`px-3.5 py-1.5 rounded-lg text-slate-300 transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              navigatingPath === "/login"
                ? "bg-indigo-500/20 text-indigo-300"
                : "hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            {navigatingPath === "/login" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                <span>Log in...</span>
              </>
            ) : (
              "Log in"
            )}
          </Link>

          <Link
            href="/signup"
            onClick={(e) => handleNavClick(e, "/signup")}
            className="btn-primary rounded-lg px-4 py-2 text-sm shadow-md transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            {navigatingPath === "/signup" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Sign up...</span>
              </>
            ) : (
              "Sign up free"
            )}
          </Link>
        </>
      )}
    </nav>
  );
}
