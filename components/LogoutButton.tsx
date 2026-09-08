"use client";

import { useFormStatus } from "react-dom";

export function LogoutButton({
  className = "px-3 py-1.5 rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 cursor-pointer active:scale-95 flex items-center gap-1.5",
  children = "Log out",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Logging out...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
