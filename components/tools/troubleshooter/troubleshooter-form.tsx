"use client";

import { useState } from "react";
import { TroubleshooterResultCards } from "./result-cards";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { TroubleshooterResult } from "@/lib/claude";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function TroubleshooterForm({ usageCount, plan }: Props) {
  const [problem, setProblem] = useState("");
  const [platforms, setPlatforms] = useState("");
  const [recentChanges, setRecentChanges] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TroubleshooterResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/troubleshooter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem,
          ...(platforms.trim() && { platforms: platforms.trim() }),
          ...(recentChanges.trim() && { recentChanges: recentChanges.trim() }),
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
          toolName: "Connection Health Check",
          href: "/tools/connection-health-check",
          description: result.nextStepDescription,
          contextSummary: `Problem: ${problem.slice(0, 80)}${problem.length > 80 ? "..." : ""}`,
        },
      ]
    : [];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CharLimitedInput
          id="problem-input"
          value={problem}
          onChange={setProblem}
          maxLength={2000}
          placeholder='e.g. "Orders aren&apos;t syncing from Shopify to Xero since yesterday"'
          disabled={loading}
          rows={6}
          label="Describe the problem"
        />

        <div>
          <label htmlFor="platforms-input" className="block text-sm font-medium text-muted-300">
            Platforms involved
          </label>
          <input
            type="text"
            id="platforms-input"
            value={platforms}
            onChange={(e) => setPlatforms(e.target.value)}
            placeholder='e.g. "Shopify, Xero"'
            disabled={loading}
            className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <CharLimitedInput
          id="changes-input"
          value={recentChanges}
          onChange={setRecentChanges}
          maxLength={1000}
          placeholder='e.g. "Updated Shopify app version yesterday"'
          disabled={loading}
          rows={4}
          label="Any recent changes?"
        />

        <button
          type="submit"
          disabled={loading || !problem.trim()}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Diagnosing..." : "Diagnose"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <TroubleshooterResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="troubleshooter"
              language=""
              framework=""
              payload={{
                problem: problem.slice(0, 500),
                platforms,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
