"use client";

import { useState, useEffect } from "react";
import { UnitTestResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { loadWorkflowContext } from "@/lib/workflow-context";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { UnitTestGeneratorResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

const ACCEPTED_FROM = ["integration-code-generator", "api-wrapper-generator"];

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function UnitTestGeneratorForm({ usageCount, plan }: Props) {
  const [code, setCode] = useState("");
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnitTestGeneratorResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
      if (ctx.payload.code) setCode(String(ctx.payload.code).slice(0, 5000));
      if (ctx.payload.files) {
        const files = ctx.payload.files as { code?: string }[];
        const combined = files.map((f) => f.code ?? "").join("\n\n");
        setCode(combined.slice(0, 5000));
      }
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
      const res = await fetch("/api/tools/unit-test-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
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
          toolName: "Dependency Audit",
          href: "/tools/dependency-audit",
          description: result.nextStepDescription,
          contextSummary: `Language: ${stack?.language ?? "unknown"}, Test framework: ${result.testFramework.slice(0, 50)}`,
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
          id="code-input"
          value={code}
          onChange={setCode}
          maxLength={5000}
          placeholder="Paste the code you want to test..."
          disabled={loading}
          rows={10}
          label="Paste the code you want to test"
        />

        <button
          type="submit"
          disabled={loading || !code.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Generating..." : "Generate Tests"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <UnitTestResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="unit-test-generator"
              language={stack?.language ?? ""}
              framework={stack?.framework ?? ""}
              payload={{
                testFramework: result.testFramework,
                files: result.files.map((f) => f.filename),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
