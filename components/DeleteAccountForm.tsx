"use client";

import { useState } from "react";
import { deleteAccount } from "@/app/settings/actions";

export function DeleteAccountForm() {
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = confirmText === "DELETE" && password.length > 0;

  return (
    <form
      action={deleteAccount}
      onSubmit={(e) => {
        if (!canSubmit) {
          e.preventDefault();
          return;
        }
        if (!confirm("This permanently deletes your account and every path you've generated. Continue?")) {
          e.preventDefault();
        }
      }}
      className="mt-3 space-y-3"
    >
      <div>
        <label htmlFor="deleteConfirm" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Type DELETE to confirm
        </label>
        <input
          id="deleteConfirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          className="mt-1.5 block w-full rounded-xl border border-red-500/40 bg-slate-900/90 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
      </div>
      <div>
        <label htmlFor="deletePassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Confirm your password
        </label>
        <input
          id="deletePassword"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1.5 block w-full rounded-xl border border-red-500/40 bg-slate-900/90 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 shadow-md"
      >
        Permanently delete my account
      </button>
    </form>
  );
}
