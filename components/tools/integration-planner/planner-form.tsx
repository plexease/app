"use client";

import { useState, useEffect } from "react";
import { PlannerResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { loadWorkflowContext } from "@/lib/workflow-context";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { IntegrationPlannerResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

const ACCEPTED_FROM = ["code-explainer"];

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function PlannerForm({ usageCount, plan }: Props) {
  const [description, setDescription] = useState("");
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntegrationPlannerResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
      if (ctx.payload.detectedPackages) {
        const packages = (ctx.payload.detectedPackages as string[]).join(", ");
        setDescription(`I need to integrate with: ${packages}`);
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
      const res = await fetch("/api/tools/integration-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, language: stack.language, framework: stack.framework }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) setCurrentUsage(limit);
        else setError(data.error ?? "Something went wrong. Please try again.");
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
    ? [{
        toolId: "integration-code-generator",
        toolName: "Code Generator",
        href: "/tools/code-generator",
        description: result.nextStepDescription,
        contextSummary: `Language: ${stack?.language ?? "unknown"}, Packages: ${result.recommendedPackages.map((p) => p.name).join(", ")}`,
      }]
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
          id="description-input"
          value={description}
          onChange={setDescription}
          maxLength={2000}
          placeholder='e.g. "I need to connect my app to Stripe for subscription billing with webhooks"'
          disabled={loading}
          rows={4}
          label="What do you need to integrate?"
          hint="Describe the systems you want to connect and what you need them to do."
        />

        <button
          type="submit"
          disabled={loading || !description.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Planning..." : "Plan Integration"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <PlannerResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="integration-planner"
              language={stack?.language ?? ""}
              framework={stack?.framework ?? ""}
              payload={{
                approach: result.approach.slice(0, 500),
                packages: result.recommendedPackages,
                architecture: result.architectureOverview.slice(0, 500),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
