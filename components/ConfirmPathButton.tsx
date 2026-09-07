"use client";

import { useFormStatus } from "react-dom";

export function ConfirmPathButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary cursor-pointer w-full rounded-xl py-3 px-4 text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Building Your Path...</span>
        </>
      ) : (
        <span>Confirm & Start This Path →</span>
      )}
    </button>
  );
}
