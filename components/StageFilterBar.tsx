"use client";

import { useState } from "react";

export type StageFilter = "all" | "in_progress" | "completed" | "not_started";

export function StageFilterBar({
  onFilterChange,
  onSearchChange,
  counts,
}: {
  onFilterChange: (filter: StageFilter) => void;
  onSearchChange: (search: string) => void;
  counts: {
    all: number;
    in_progress: number;
    completed: number;
    not_started: number;
  };
}) {
  const [activeFilter, setActiveFilter] = useState<StageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterClick = (filter: StageFilter) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearchChange(query);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleFilterClick("all")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
            activeFilter === "all"
              ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
              : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
          }`}
        >
          All Stages ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => handleFilterClick("in_progress")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
            activeFilter === "in_progress"
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md"
              : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-amber-300 hover:border-slate-700"
          }`}
        >
          ⚡ In Progress ({counts.in_progress})
        </button>
        <button
          type="button"
          onClick={() => handleFilterClick("completed")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
            activeFilter === "completed"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md"
              : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-emerald-300 hover:border-slate-700"
          }`}
        >
          ✓ Completed ({counts.completed})
        </button>
        <button
          type="button"
          onClick={() => handleFilterClick("not_started")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
            activeFilter === "not_started"
              ? "bg-slate-800 text-slate-200 border-slate-700 shadow-md"
              : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
          }`}
        >
          To Do ({counts.not_started})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative min-w-[200px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search stage topics..."
          className="w-full rounded-xl border border-slate-800 bg-slate-950/90 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
}
