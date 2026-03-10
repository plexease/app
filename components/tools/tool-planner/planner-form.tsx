"use client";

import { useState } from "react";
import { ToolPlannerResultCards } from "./result-cards";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { ToolPlannerResult } from "@/lib/claude";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function PlannerForm({ usageCount, plan }: Props) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolPlannerResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/tool-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
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
          toolName: "Integration Setup",
          href: "/tools/integration-setup",
          description: result.nextStepDescription,
          contextSummary: `Tools: ${result.recommendations.map((r) => r.name).join(", ")}`,
        },
      ]
    : [];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CharLimitedInput
          id="description-input"
          value={description}
          onChange={setDescription}
          maxLength={2000}
          placeholder='e.g. "I sell online and need shipping, accounting, and payment tools"'
          disabled={loading}
          rows={4}
          label="Describe your business needs"
        />

        <button
          type="submit"
          disabled={loading || !description.trim()}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Finding..." : "Find Tools"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <ToolPlannerResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="tool-planner"
              language=""
              framework=""
              payload={{
                recommendations: result.recommendations.map((r) => r.name),
                stackOverview: result.stackOverview.slice(0, 500),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
