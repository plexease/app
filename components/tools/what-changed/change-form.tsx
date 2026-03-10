"use client";

import { useState } from "react";
import { WhatChangedResultCards } from "./result-cards";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { WhatChangedResult } from "@/lib/claude";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function ChangeForm({ usageCount, plan }: Props) {
  const [change, setChange] = useState("");
  const [currentSetup, setCurrentSetup] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhatChangedResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/what-changed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          change,
          ...(currentSetup.trim() ? { currentSetup } : {}),
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
          toolName: "Upgrade Assistant",
          href: "/tools/upgrade-assistant",
          description: result.nextStepDescription,
          contextSummary: `Change: ${change.slice(0, 100)}`,
        },
      ]
    : [];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CharLimitedInput
          id="change-input"
          value={change}
          onChange={setChange}
          maxLength={2000}
          placeholder='e.g. "Stripe deprecated API version 2024-12-18" or "Royal Mail updated their shipping API"'
          disabled={loading}
          rows={6}
          label="Describe the change"
        />

        <CharLimitedInput
          id="setup-input"
          value={currentSetup}
          onChange={setCurrentSetup}
          maxLength={1000}
          placeholder='e.g. "We use Stripe for payments connected to Xero for accounting"'
          disabled={loading}
          rows={3}
          label="Describe your current setup (optional)"
        />

        <button
          type="submit"
          disabled={loading || !change.trim()}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Analysing..." : "Analyse Impact"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <WhatChangedResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="what-changed"
              language=""
              framework=""
              payload={{
                change: change.slice(0, 500),
                affectedCount: result.affectedIntegrations.length,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
