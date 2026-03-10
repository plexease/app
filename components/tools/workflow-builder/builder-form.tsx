"use client";

import { useState } from "react";
import { BuilderResultCards } from "./result-cards";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import { useFeedback } from "@/hooks/use-feedback";
import { InlineFeedbackCard } from "@/components/feedback/inline-feedback-card";
import type { WorkflowBuilderResult } from "@/lib/claude";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function BuilderForm({ usageCount, plan }: Props) {
  const [description, setDescription] = useState("");
  const [platforms, setPlatforms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WorkflowBuilderResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const { showFifthUseCard } = useFeedback();

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/workflow-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, platforms: platforms || undefined }),
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
        toolId: "webhook-builder",
        toolName: "Webhook Builder",
        href: "/tools/webhook-builder",
        description: result.nextStepDescription,
        contextSummary: `Trigger: ${result.trigger.event} on ${result.trigger.platform}`,
      }]
    : [];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CharLimitedInput
          id="description-input"
          value={description}
          onChange={setDescription}
          maxLength={2000}
          placeholder='e.g. "When a new order comes in on Shopify, create an invoice in Xero and notify the team on Slack"'
          disabled={loading}
          rows={4}
          label="Describe the workflow you want to automate"
        />

        <CharLimitedInput
          id="platforms-input"
          value={platforms}
          onChange={setPlatforms}
          maxLength={1000}
          placeholder='e.g. "Shopify, Xero, Slack"'
          disabled={loading}
          rows={2}
          label="Platforms involved (if not mentioned above)"
        />

        <button
          type="submit"
          disabled={loading || !description.trim()}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Designing..." : "Design Workflow"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} credits used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <BuilderResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="workflow-builder"
              language=""
              framework=""
              payload={{
                trigger: result.trigger,
                steps: result.steps,
              }}
            />
            {showFifthUseCard && <InlineFeedbackCard toolName="workflow-builder" />}
          </>
        )}
      </div>
    </div>
  );
}
