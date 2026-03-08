"use client";

import { useState, useEffect } from "react";
import { ErrorExplainerResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { loadWorkflowContext } from "@/lib/workflow-context";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { ErrorExplainerResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

const ACCEPTED_FROM = ["health-checker"];

type Props = {
  usageCount: number;
  isPro: boolean;
};

export function ErrorExplainerForm({ usageCount, isPro }: Props) {
  const [errorLog, setErrorLog] = useState("");
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ErrorExplainerResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);

  const limitReached = !isPro && currentUsage >= FREE_MONTHLY_LIMIT;

  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
      if (ctx.payload.errorLog) setErrorLog(String(ctx.payload.errorLog).slice(0, 3000));
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
      const res = await fetch("/api/tools/error-explainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorLog,
          language: stack.language,
          framework: stack.framework,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setCurrentUsage(FREE_MONTHLY_LIMIT);
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

  const toolNameMap: Record<string, { name: string; href: string }> = {
    "dependency-audit": { name: "Dependency Audit", href: "/tools/dependency-audit" },
    "health-checker": { name: "Health Checker", href: "/tools/health-checker" },
  };

  const recommendations: WorkflowRecommendation[] = result
    ? [
        {
          toolId: result.nextStepToolId,
          toolName: toolNameMap[result.nextStepToolId]?.name ?? result.nextStepToolId,
          href: toolNameMap[result.nextStepToolId]?.href ?? `/tools/${result.nextStepToolId}`,
          description: result.nextStepDescription,
          contextSummary: `Language: ${stack?.language ?? "unknown"}, Error: ${result.rootCause.slice(0, 100)}`,
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

        <CharLimitedInput
          id="error-log-input"
          value={errorLog}
          onChange={setErrorLog}
          maxLength={3000}
          placeholder="Paste your error log or stack trace here..."
          disabled={loading}
          rows={10}
          label="Paste your error log or stack trace"
        />

        <button
          type="submit"
          disabled={loading || !errorLog.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Analysing..." : "Analyse"}
        </button>
      </form>

      {!isPro && (
        <p className="mt-2 text-xs text-muted-500">
          {currentUsage} of {FREE_MONTHLY_LIMIT} free lookups used this month
        </p>
      )}

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <ErrorExplainerResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="error-explainer"
              language={stack?.language ?? ""}
              framework={stack?.framework ?? ""}
              payload={{
                rootCause: result.rootCause.slice(0, 500),
                fixSuggestions: result.fixSuggestions,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
