"use client";

import { useState } from "react";
import Link from "next/link";

type SampleDomain = {
  id: string;
  name: string;
  emoji: string;
  hours: string;
  cost: string;
  stages: {
    title: string;
    description: string;
    hours: string;
    resource: string;
    type: string;
  }[];
};

const SAMPLE_DOMAINS: SampleDomain[] = [
  {
    id: "backend",
    name: "Backend Development",
    emoji: "⚙️",
    hours: "5 hrs/week",
    cost: "Free ($0)",
    stages: [
      {
        title: "HTTP Protocol & Web Architecture",
        description: "Client-server architecture, HTTP methods, headers, status codes, and URI structures.",
        hours: "4h",
        resource: "MDN Web Docs & Node.js Docs",
        type: "Docs",
      },
      {
        title: "Node.js Event Loop & Express APIs",
        description: "Asynchronous JavaScript event loop, Express middleware, routing, and REST design.",
        hours: "6h",
        resource: "Traversy Media / YouTube",
        type: "Video",
      },
      {
        title: "SQL Databases & Relational Modeling",
        description: "PostgreSQL schema design, indexing, joins, transactions, and Supabase integration.",
        hours: "8h",
        resource: "Supabase Official Guides",
        type: "Interactive",
      },
      {
        title: "Authentication & Security Standards",
        description: "JWT session tokens, password hashing with bcrypt, CORS rules, and rate-limiting.",
        hours: "7h",
        resource: "Web Security Primers & Auth Docs",
        type: "Article",
      },
    ],
  },
  {
    id: "frontend",
    name: "Frontend Development",
    emoji: "🎨",
    hours: "6 hrs/week",
    cost: "Free ($0)",
    stages: [
      {
        title: "Semantic HTML5 & Modern CSS Layouts",
        description: "Flexbox, CSS Grid, responsive design, and web accessibility (a11y) standards.",
        hours: "5h",
        resource: "web.dev & CSS-Tricks",
        type: "Docs",
      },
      {
        title: "JavaScript ES6+ & Async Fetching",
        description: "Promises, async/await, DOM manipulation, and modern JavaScript features.",
        hours: "7h",
        resource: "JavaScript.info",
        type: "Guide",
      },
      {
        title: "React Component Architecture & Hooks",
        description: "JSX, useState, useEffect, context API, and custom hooks pattern.",
        hours: "8h",
        resource: "React.dev Docs & Fireship",
        type: "Video",
      },
      {
        title: "Next.js App Router & SSR Rendering",
        description: "Server Components, Server Actions, route handlers, and performance optimization.",
        hours: "8h",
        resource: "Next.js Learn Documentation",
        type: "Interactive",
      },
    ],
  },
  {
    id: "ai-ml",
    name: "AI & Machine Learning",
    emoji: "🤖",
    hours: "8 hrs/week",
    cost: "Free ($0)",
    stages: [
      {
        title: "Python for Data & Matrix Computations",
        description: "NumPy arrays, Pandas DataFrames, and vectorized mathematical operations.",
        hours: "6h",
        resource: "Python Data Science Handbook",
        type: "Book/Docs",
      },
      {
        title: "Supervised ML with Scikit-Learn",
        description: "Linear regression, decision trees, cross-validation, and classification models.",
        hours: "8h",
        resource: "Scikit-Learn Official Tutorials",
        type: "Docs",
      },
      {
        title: "Deep Learning & Neural Networks in PyTorch",
        description: "Tensors, backpropagation, activation functions, and loss gradient descent.",
        hours: "10h",
        resource: "PyTorch Deep Learning 60min Blitz",
        type: "Interactive",
      },
      {
        title: "Transformers & Hugging Face LLM Fine-Tuning",
        description: "Self-attention mechanisms, pretrained LLMs, and prompt engineering.",
        hours: "8h",
        resource: "Hugging Face Course & Guides",
        type: "Video",
      },
    ],
  },
  {
    id: "devops",
    name: "DevOps & Cloud Infrastructure",
    emoji: "☁️",
    hours: "5 hrs/week",
    cost: "Free ($0)",
    stages: [
      {
        title: "Linux CLI & Bash Shell Scripting",
        description: "Terminal navigation, permissions, environment variables, and shell scripts.",
        hours: "5h",
        resource: "Linux Journey & Command Line Power",
        type: "Docs",
      },
      {
        title: "Docker Containerization & Compose",
        description: "Dockerfiles, multi-stage builds, image layers, and docker-compose services.",
        hours: "6h",
        resource: "Docker Documentation & Network Guides",
        type: "Guide",
      },
      {
        title: "Automated CI/CD Pipelines with GitHub Actions",
        description: "Workflow YAML files, test automation, matrix builds, and auto-deployments.",
        hours: "7h",
        resource: "GitHub Actions Official Docs",
        type: "Docs",
      },
      {
        title: "Infrastructure as Code with Terraform",
        description: "Cloud resource provisioning, state files, HCL configuration, and AWS deployment.",
        hours: "8h",
        resource: "HashiCorp Learn & Tutorials",
        type: "Interactive",
      },
    ],
  },
];

export function LandingRoadmapPreview() {
  const [selectedDomain, setSelectedDomain] = useState<SampleDomain>(SAMPLE_DOMAINS[0]);

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border-indigo-500/30 shadow-2xl">
      {/* Domain Selection Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-800 pb-6">
        {SAMPLE_DOMAINS.map((domain) => (
          <button
            key={domain.id}
            type="button"
            onClick={() => setSelectedDomain(domain)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition border ${
              selectedDomain.id === domain.id
                ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>{domain.emoji}</span>
            <span>{domain.name}</span>
          </button>
        ))}
      </div>

      {/* Header metrics */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Interactive Roadmap Preview
          </span>
          <h3 className="mt-1 font-serif text-2xl font-bold text-white flex items-center gap-2">
            <span>{selectedDomain.emoji}</span> {selectedDomain.name}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-800/90 px-3.5 py-1 text-xs font-semibold text-slate-300 border border-slate-700">
            ⏱️ {selectedDomain.hours}
          </span>
          <span className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            💰 {selectedDomain.cost}
          </span>
        </div>
      </div>

      {/* Stage list */}
      <div className="mt-6 space-y-3.5">
        {selectedDomain.stages.map((stage, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all hover:border-indigo-500/40 hover:bg-slate-800/40"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 text-xs font-bold text-indigo-400 border border-indigo-500/30 mt-0.5">
                {idx + 1}
              </span>
              <div>
                <h4 className="font-bold text-white text-sm">{stage.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{stage.description}</p>
                <p className="text-[11px] text-indigo-300 font-medium mt-1">
                  🔗 Key Resource: {stage.resource}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium shrink-0 self-end sm:self-center">
              <span className="rounded-md bg-slate-800/90 px-2.5 py-1 text-slate-300 border border-slate-700">
                ~{stage.hours}
              </span>
              <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-indigo-300 border border-indigo-500/20">
                {stage.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        {(() => {
          const fieldSlug =
            selectedDomain.id === "backend"
              ? "backend-development"
              : selectedDomain.id === "frontend"
              ? "frontend-development"
              : selectedDomain.id === "ai-ml"
              ? "ai-machine-learning"
              : "devops-cloud";

          return (
            <Link
              href={`/onboarding?field=${fieldSlug}`}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold shadow-xl"
            >
              <span>✨</span> Generate Your Custom {selectedDomain.name} Roadmap
            </Link>
          );
        })()}
      </div>
    </div>
  );
}
