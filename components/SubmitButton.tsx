"use client";

import { GeneratePathIcon } from "@/components/GeneratePathIcon";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full rounded-xl px-6 py-4 text-base font-semibold shadow-xl flex items-center justify-center gap-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Checking resources and building your path…</span>
        </>
      ) : (
        <>
          <GeneratePathIcon />
          <span>Generate My Personal Roadmap</span>
        </>
      )}
    </button>
  );
}
