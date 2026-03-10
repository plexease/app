"use client";

import { useState } from "react";
import { IntegrationSetupResultCards } from "./result-cards";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { IntegrationSetupResult } from "@/lib/claude";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function SetupForm({ usageCount, plan }: Props) {
  const [platformA, setPlatformA] = useState("");
  const [platformB, setPlatformB] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntegrationSetupResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/integration-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformA,
          platformB,
          goal: goal || undefined,
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
          toolName: "Webhook Builder",
          href: "/tools/webhook-builder",
          description: result.nextStepDescription,
          contextSummary: `Platforms: ${platformA} + ${platformB}`,
        },
      ]
    : [];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="platform-a-input" className="block text-sm font-medium text-muted-300">
              First platform
            </label>
            <input
              id="platform-a-input"
              type="text"
              value={platformA}
              onChange={(e) => setPlatformA(e.target.value)}
              placeholder='e.g. "Shopify"'
              disabled={loading}
              required
              className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="platform-b-input" className="block text-sm font-medium text-muted-300">
              Second platform
            </label>
            <input
              id="platform-b-input"
              type="text"
              value={platformB}
              onChange={(e) => setPlatformB(e.target.value)}
              placeholder='e.g. "Xero"'
              disabled={loading}
              required
              className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <CharLimitedInput
          id="goal-input"
          value={goal}
          onChange={setGoal}
          maxLength={1000}
          placeholder='e.g. "Automatically sync new orders to my accounting software"'
          disabled={loading}
          rows={3}
          label="What do you want the connection to do?"
        />

        <button
          type="submit"
          disabled={loading || !platformA.trim() || !platformB.trim()}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Creating..." : "Create Guide"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <IntegrationSetupResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="integration-setup"
              language=""
              framework=""
              payload={{
                platformA,
                platformB,
                goal,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
