"use client";

import { useState } from "react";
import { FIELD_CATALOG } from "@/lib/fields/catalog";
import { FIELD_QUIZZES } from "@/lib/onboarding/skill-quiz";

export function FieldAndQuizPicker() {
  const [fieldSlug, setFieldSlug] = useState(FIELD_CATALOG[0].slug);
  const [skipQuiz, setSkipQuiz] = useState(false);

  const quiz = FIELD_QUIZZES[fieldSlug] ?? FIELD_QUIZZES["backend-development"];

  return (
    <div className="space-y-6">
      {/* 1. Field Selector */}
      <div>
        <label htmlFor="fieldSlug" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          1. Select Target Domain
        </label>
        <select
          id="fieldSlug"
          name="fieldSlug"
          required
          value={fieldSlug}
          onChange={(e) => setFieldSlug(e.target.value)}
          className="mt-2 block w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-medium text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {FIELD_CATALOG.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quiz Mode Choice */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Skill Assessment Option</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Take a 5-question technical quiz to calibrate your roadmap level, or skip and set manually below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSkipQuiz(!skipQuiz)}
          className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition border ${
            skipQuiz
              ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
          }`}
        >
          {skipQuiz ? "✓ Quiz Skipped" : "Skip Quiz"}
        </button>
      </div>

      {/* Quiz Section */}
      {!skipQuiz && quiz && quiz.length > 0 && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">
                ⚡ Skill Calibration Check
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Answer these 5 technical questions for precision level matching.
              </p>
            </div>
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20">
              5 Questions
            </span>
          </div>

          <div className="space-y-5">
            {quiz.map((q, qi) => (
              <fieldset key={q.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <legend className="px-2 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Question {qi + 1} of {quiz.length}
                </legend>
                <p className="mt-1 text-sm font-medium text-white">
                  {q.prompt}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((option, oi) => (
                    <label
                      key={oi}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3.5 py-2.5 text-xs text-slate-300 transition hover:border-slate-700 hover:bg-slate-800/50 has-[:checked]:border-indigo-500/60 has-[:checked]:bg-indigo-500/10 has-[:checked]:text-white"
                    >
                      <input
                        type="radio"
                        name={`quiz_${q.id}`}
                        value={oi}
                        required={!skipQuiz}
                        className="h-4 w-4 text-indigo-600 border-slate-700 bg-slate-900 focus:ring-indigo-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
