"use client";

import { useState } from "react";
import { AuthGuideResultCards } from "./result-cards";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import { useFeedback } from "@/hooks/use-feedback";
import { InlineFeedbackCard } from "@/components/feedback/inline-feedback-card";
import type { AuthGuideResult } from "@/lib/claude";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function GuideForm({ usageCount, plan }: Props) {
  const [service, setService] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuthGuideResult | null>(null);
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
      const res = await fetch("/api/tools/auth-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          ...(purpose.trim() ? { purpose: purpose.trim() } : {}),
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
          contextSummary: `Service: ${service}`,
        },
      ]
    : [];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="service-input" className="block text-sm font-medium text-muted-300">
            Which service do you need to authenticate with?
          </label>
          <input
            id="service-input"
            type="text"
            value={service}
            onChange={(e) => setService(e.target.value)}
            disabled={loading}
            required
            placeholder='e.g. "Stripe", "Google Sheets API", "Xero"'
            className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <CharLimitedInput
          id="purpose-input"
          value={purpose}
          onChange={setPurpose}
          maxLength={1000}
          placeholder='e.g. "Read customer orders and create invoices"'
          disabled={loading}
          rows={3}
          label="What will you use it for?"
        />

        <button
          type="submit"
          disabled={loading || !service.trim()}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Loading..." : "Get Auth Guide"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} credits used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <AuthGuideResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="auth-guide"
              language=""
              framework=""
              payload={{
                service,
                authMethod: result.authMethod,
              }}
            />
            {showFifthUseCard && <InlineFeedbackCard toolName="auth-guide" />}
          </>
        )}
      </div>
    </div>
  );
}
