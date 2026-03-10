"use client";

import { useState } from "react";
import { WebhookBuilderResultCards } from "./result-cards";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { WebhookBuilderResult } from "@/lib/claude";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function BuilderForm({ usageCount, plan }: Props) {
  const [sourceApp, setSourceApp] = useState("");
  const [targetApp, setTargetApp] = useState("");
  const [events, setEvents] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WebhookBuilderResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/webhook-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceApp,
          targetApp,
          ...(events.trim() ? { events } : {}),
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
          toolName: "Troubleshooter",
          href: "/tools/troubleshooter",
          description: result.nextStepDescription,
          contextSummary: `Source: ${sourceApp}, Target: ${targetApp}`,
        },
      ]
    : [];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="source-app-input" className="block text-sm font-medium text-muted-300">
            App sending events
          </label>
          <input
            id="source-app-input"
            type="text"
            value={sourceApp}
            onChange={(e) => setSourceApp(e.target.value)}
            placeholder='e.g. "Shopify"'
            disabled={loading}
            required
            className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="target-app-input" className="block text-sm font-medium text-muted-300">
            App receiving events
          </label>
          <input
            id="target-app-input"
            type="text"
            value={targetApp}
            onChange={(e) => setTargetApp(e.target.value)}
            placeholder='e.g. "Slack"'
            disabled={loading}
            required
            className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <CharLimitedInput
          id="events-input"
          value={events}
          onChange={setEvents}
          maxLength={1000}
          placeholder='e.g. "New order, payment received, shipping update"'
          disabled={loading}
          rows={3}
          label="What events should trigger notifications?"
        />

        <button
          type="submit"
          disabled={loading || !sourceApp.trim() || !targetApp.trim()}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Building..." : "Build Webhook"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <WebhookBuilderResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="webhook-builder"
              language=""
              framework=""
              payload={{
                sourceApp,
                targetApp,
                webhookUrl: result.sourceSetup.webhookUrl,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
