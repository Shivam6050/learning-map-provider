"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ProfileAvatar } from "./ProfileAvatar";
import { LogoutButton } from "./LogoutButton";
import { logout } from "@/app/auth/actions";
import styles from "./AccountMenu.module.css";
export function AccountMenu({ avatarId, displayName }: { avatarId?: string; displayName: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId(), pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className={styles.account}>
    <div className={styles.identity} title={displayName}><ProfileAvatar id={avatarId} size={34}/><span className={styles.displayName}>{displayName}</span></div>
    <div className={styles.dropdown} ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button ref={trigger} type="button" className={styles.trigger} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="6" r="2" fill="#182923" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="12" r="2" fill="#182923" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="18" r="2" fill="#182923" stroke="currentColor" strokeWidth="1.5"/></svg>
        <span>Settings</span><span aria-hidden="true" className={styles.chevron} style={{transform: open ? "rotate(180deg)" : undefined}}>⌄</span>
      </button>
      {open && <div id={panelId} className={styles.panel}>
        <div className={styles.heading}><span>YOUR WORKSPACE</span><strong>{displayName}</strong></div>
        <nav aria-label="Account shortcuts" onClick={() => setOpen(false)}>
          <Link href="/settings" aria-current={pathname === "/settings" ? "page" : undefined}><span>Profile &amp; preferences<small>Update your name and companion</small></span><span aria-hidden="true">↗</span></Link>
          <Link href="/dashboard"><span>My learning paths<small>Continue where you left off</small></span><span aria-hidden="true">↗</span></Link>
          <Link href="/onboarding"><span>Create a new path<small>Choose a goal, level and budget</small></span><span aria-hidden="true">+</span></Link>
        </nav>
        <div className={styles.legal}><Link href="/privacy" onClick={() => setOpen(false)}>Privacy</Link><span aria-hidden="true">·</span><Link href="/terms" onClick={() => setOpen(false)}>Terms</Link></div>
        <form action={logout} className={styles.logout}><LogoutButton className={styles.logoutButton}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 4H5v16h5m-1-8h11m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>Log out</LogoutButton></form>
      </div>}
    </div>
  </div>;
}
