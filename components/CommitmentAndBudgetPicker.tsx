"use client";

import { useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { formatMoney, type Currency } from "@/lib/currency/format";

export function CommitmentAndBudgetPicker() {
  const { currency: preferredCurrency, setCurrency } = useCurrency();
  const currency = preferredCurrency ?? "USD";
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [budgetTotal, setBudgetTotal] = useState(currency === "INR" ? 5000 : 50);

  // Estimate total hours based on skill level (typical path ~80-120 hrs)
  const baseHours = skillLevel === "beginner" ? 110 : skillLevel === "intermediate" ? 85 : 65;
  const estimatedWeeks = Math.max(1, Math.ceil(baseHours / Math.max(1, weeklyHours)));

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          2. Commitment & Budget
        </h3>
        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20">
          Estimated: ~{estimatedWeeks} {estimatedWeeks === 1 ? "week" : "weeks"}
        </span>
      </div>

      <div>
        <label htmlFor="skillLevel" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Self-Reported Skill Level
        </label>
        <select
          id="skillLevel"
          name="skillLevel"
          required
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
          className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="unknown">Not sure — use my quiz result</option>
          <option value="beginner">Beginner (Starting from scratch)</option>
          <option value="intermediate">Intermediate (Know fundamentals)</option>
          <option value="advanced">Expert / Advanced (Deepening expertise)</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="weeklyHours" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Hours Per Week You Can Commit (1 - 80)
          </label>
          <span className="text-xs font-bold text-indigo-400">{weeklyHours} hrs/week</span>
        </div>
        <input
          id="weeklyHours"
          name="weeklyHours"
          type="number"
          min={1}
          max={80}
          value={weeklyHours}
          onChange={(e) => setWeeklyHours(Math.max(1, Math.min(80, Number(e.target.value))))}
          required
          className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <div className="mt-2 flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={80}
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      <p className="text-sm text-slate-300">Your three options: up to {formatMoney(budgetTotal, currency)}, up to {formatMoney(Math.floor(budgetTotal * 50) / 100, currency)}, and free. Currency is remembered across the site.</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label htmlFor="budgetTotal" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Total Budget Limit (0 = Free Only)
          </label>
          <input
            id="budgetTotal"
            name="budgetTotal"
            type="number"
            min={0}
            step="0.01"
            max={100000}
            value={budgetTotal}
            onChange={(e) => setBudgetTotal(Math.max(0, Number(e.target.value)))}
            placeholder="e.g. 50"
            required
            className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
