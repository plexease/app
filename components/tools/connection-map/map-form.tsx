"use client";

import { useState } from "react";
import { ConnectionMapResultCards } from "./result-cards";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import { useFeedback } from "@/hooks/use-feedback";
import { InlineFeedbackCard } from "@/components/feedback/inline-feedback-card";
import type { ConnectionMapResult } from "@/lib/claude";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function MapForm({ usageCount, plan }: Props) {
  const [platforms, setPlatforms] = useState("");
  const [concerns, setConcerns] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConnectionMapResult | null>(null);
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
      const res = await fetch("/api/tools/connection-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms,
          ...(concerns.trim() ? { concerns } : {}),
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
          toolName: "Integration Setup",
          href: "/tools/integration-setup",
          description: result.nextStepDescription,
          contextSummary: `Platforms: ${platforms.slice(0, 100)}`,
        },
      ]
    : [];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CharLimitedInput
          id="platforms-input"
          value={platforms}
          onChange={setPlatforms}
          maxLength={2000}
          placeholder='e.g. "Shopify for online store, Stripe for payments, Xero for accounting, Mailchimp for email marketing"'
          disabled={loading}
          rows={6}
          label="Your platforms and tools"
        />

        <CharLimitedInput
          id="concerns-input"
          value={concerns}
          onChange={setConcerns}
          maxLength={1000}
          placeholder='e.g. "I&#39;m worried about order data not reaching my accountant"'
          disabled={loading}
          rows={3}
          label="Any specific concerns (optional)"
        />

        <button
          type="submit"
          disabled={loading || !platforms.trim()}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Mapping..." : "Map Connections"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} credits used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <ConnectionMapResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="connection-map"
              language=""
              framework=""
              payload={{
                platforms: platforms.slice(0, 500),
                connections: result.connections.map((c) => `${c.from} -> ${c.to}`),
              }}
            />
            {showFifthUseCard && <InlineFeedbackCard toolName="connection-map" />}
          </>
        )}
      </div>
    </div>
  );
}
