"use client";

import { useState, useEffect } from "react";
import { HealthCheckerResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { loadWorkflowContext } from "@/lib/workflow-context";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import { useFeedback } from "@/hooks/use-feedback";
import { InlineFeedbackCard } from "@/components/feedback/inline-feedback-card";
import type { HealthCheckerResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

const ACCEPTED_FROM = ["error-resolver"];

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function HealthCheckerForm({ usageCount, plan }: Props) {
  const [config, setConfig] = useState("");
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HealthCheckerResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);
  const { showFifthUseCard } = useFeedback();

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
      if (ctx.payload.config) setConfig(String(ctx.payload.config).slice(0, 2000));
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
      const res = await fetch("/api/tools/connection-health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
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
          toolName: "Error Resolver",
          href: "/tools/error-resolver",
          description: result.nextStepDescription,
          contextSummary: `Language: ${stack?.language ?? "unknown"}, Status: ${result.configurationStatus.slice(0, 80)}`,
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
          id="config-input"
          value={config}
          onChange={setConfig}
          maxLength={2000}
          placeholder="Paste your config or describe your integration setup..."
          disabled={loading}
          rows={8}
          label="Paste your config or describe your integration setup"
        />

        <button
          type="submit"
          disabled={loading || !config.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Checking..." : "Check Health"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} credits used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <HealthCheckerResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="connection-health-check"
              language={stack?.language ?? ""}
              framework={stack?.framework ?? ""}
              payload={{
                configurationStatus: result.configurationStatus.slice(0, 500),
                issues: result.issues.map((i) => i.description),
              }}
            />
            {showFifthUseCard && <InlineFeedbackCard toolName="connection-health-check" />}
          </>
        )}
      </div>
    </div>
  );
}
