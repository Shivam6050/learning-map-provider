"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { logout } from "@/app/auth/actions";
import { LogoutButton } from "@/components/LogoutButton";
import { getAvatarEmoji } from "@/lib/profile/avatars";

export function NavbarNav({
  user,
  avatarEmoji,
}: {
  user: any;
  avatarEmoji: string;
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
    <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
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
            <span>✨</span> Generate Path
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

          <Link
            href="/settings"
            onClick={(e) => handleNavClick(e, "/settings")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-slate-200 transition-all duration-200 active:scale-95 cursor-pointer ${
              navigatingPath === "/settings"
                ? "border-indigo-500/80 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40"
                : "border-slate-700/60 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-800"
            }`}
            title="Account Settings"
          >
            {navigatingPath === "/settings" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                <span>Settings...</span>
              </>
            ) : (
              <>
                <span className="text-lg leading-none">{avatarEmoji}</span>
                <span className="hidden sm:inline">Settings</span>
              </>
            )}
          </Link>

          <form action={logout}>
            <LogoutButton />
          </form>
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
