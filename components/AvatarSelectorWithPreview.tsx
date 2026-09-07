"use client";

import { useState } from "react";
import { AVATAR_OPTIONS, type Avatar } from "@/lib/profile/avatars";

export function AvatarSelectorWithPreview({ defaultAvatarId }: { defaultAvatarId?: string }) {
  const [selectedId, setSelectedId] = useState<string>(
    AVATAR_OPTIONS.some((a) => a.id === defaultAvatarId) ? defaultAvatarId! : AVATAR_OPTIONS[0].id
  );

  const selectedAvatar: Avatar =
    AVATAR_OPTIONS.find((a) => a.id === selectedId) ?? AVATAR_OPTIONS[0];

  return (
    <div className="space-y-4">
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Companion Avatar
        </span>
        <p className="mt-1 text-xs text-slate-400">
          Pick the companion avatar that walks your roadmap milestones with you.
        </p>

        {/* Live Preview Card */}
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 backdrop-blur-md">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-3xl border border-indigo-500/30 shadow-md animate-bounce">
            {selectedAvatar.emoji}
          </span>
          <div>
            <p className="text-xs font-bold text-white">
              Selected: <span className="text-indigo-300">{selectedAvatar.label}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              This companion will guide your progress on game-board maps & dashboard statistics.
            </p>
          </div>
        </div>

        {/* Radio options grid */}
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {AVATAR_OPTIONS.map((avatar) => {
            const isSelected = avatar.id === selectedId;
            return (
              <label key={avatar.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="avatarId"
                  value={avatar.id}
                  checked={isSelected}
                  onChange={() => setSelectedId(avatar.id)}
                  required
                  className="peer sr-only"
                />
                <span
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-2xl transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/30 shadow-md"
                      : "border-slate-800 bg-slate-900/90 hover:border-slate-700"
                  }`}
                >
                  {avatar.emoji}
                  <span className="text-[10px] font-semibold text-slate-400">{avatar.label}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
