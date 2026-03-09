"use client";

import { useState, useEffect } from "react";
import { CodeExplainerResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { loadWorkflowContext } from "@/lib/workflow-context";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { CodeExplainerResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

const SCOPE_OPTIONS = [
  { value: "how-it-works", label: "How does this code work?" },
  { value: "specific-function", label: "What does a specific function do?" },
  { value: "why-failing", label: "Why might this be failing?" },
  { value: "dependencies", label: "What does this depend on?" },
];

const ACCEPTED_FROM = ["error-explainer", "health-checker"];

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function ExplainerForm({ usageCount, plan }: Props) {
  const [code, setCode] = useState("");
  const [scopeQuestion, setScopeQuestion] = useState(SCOPE_OPTIONS[0].value);
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeExplainerResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  // Load workflow context on mount
  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
      if (ctx.payload.code) setCode(String(ctx.payload.code).slice(0, 5000));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stack) {
      setError("Please select a language.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/code-explainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          scopeQuestion: SCOPE_OPTIONS.find((o) => o.value === scopeQuestion)?.label ?? scopeQuestion,
          language: stack.language,
          framework: stack.framework,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setCurrentUsage(limit);
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setResult(data);
      setCurrentUsage((prev) => prev + 1);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (limitReached) {
    return <LimitReachedCard />;
  }

  const recommendations: WorkflowRecommendation[] = result
    ? [
        {
          toolId: result.nextStepToolId,
          toolName: result.nextStepToolId === "integration-planner" ? "Integration Planner" : "Package Advisor",
          href: result.nextStepToolId === "integration-planner" ? "/tools/integration-planner" : "/tools/package-advisor",
          description: result.nextStepDescription,
          contextSummary: `Language: ${stack?.language ?? "unknown"}, Packages: ${result.detectedPackages.join(", ") || "none"}`,
        },
      ]
    : [];

  return (
    <div>
      {contextBanner && (
        <div className="mb-4 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm text-brand-300">
          {contextBanner}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <StackSelector onChange={setStack} />

        <div>
          <label htmlFor="scope-question" className="block text-sm font-medium text-muted-300">
            What do you want to understand?
          </label>
          <select
            id="scope-question"
            value={scopeQuestion}
            onChange={(e) => setScopeQuestion(e.target.value)}
            disabled={loading}
            className="mt-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {SCOPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <CharLimitedInput
          id="code-input"
          value={code}
          onChange={setCode}
          maxLength={5000}
          placeholder="Paste the relevant code section here..."
          disabled={loading}
          rows={10}
          label="Code"
          hint="Focus on the function or class you're asking about, not the whole file."
        />

        <button
          type="submit"
          disabled={loading || !code.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Explaining..." : "Explain"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <CodeExplainerResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="code-explainer"
              language={stack?.language ?? ""}
              framework={stack?.framework ?? ""}
              payload={{
                detectedPackages: result.detectedPackages,
                explanation: result.explanation.slice(0, 500),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
