"use client";

import { useFormStatus } from "react-dom";

export function SaveProfileButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Saving Profile Changes...</span>
        </>
      ) : (
        <>
          <span>⚙️</span>
          <span>Save Profile Changes</span>
        </>
      )}
    </button>
  );
}
