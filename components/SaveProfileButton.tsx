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
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
            <path d="M7 3v6h9V3M7 21v-8h10v8" />
          </svg>
          <span>Save Profile Changes</span>
        </>
      )}
    </button>
  );
}
