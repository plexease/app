"use client";

import { useState, useEffect } from "react";
import { MigrationResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { loadWorkflowContext } from "@/lib/workflow-context";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import { useFeedback } from "@/hooks/use-feedback";
import { InlineFeedbackCard } from "@/components/feedback/inline-feedback-card";
import type { MigrationAssistantResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

const ACCEPTED_FROM = ["compatibility-check"];

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function MigrationAssistantForm({ usageCount, plan }: Props) {
  const [migratingFrom, setMigratingFrom] = useState("");
  const [migratingTo, setMigratingTo] = useState("");
  const [code, setCode] = useState("");
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MigrationAssistantResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);
  const { showFifthUseCard } = useFeedback();

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
      if (ctx.payload.code) setCode(String(ctx.payload.code).slice(0, 5000));
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
      const res = await fetch("/api/tools/upgrade-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          migratingFrom,
          migratingTo,
          code,
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
          toolName: "Code Generator",
          href: "/tools/code-generator",
          description: result.nextStepDescription,
          contextSummary: `Language: ${stack?.language ?? "unknown"}, Migration: ${migratingFrom} → ${migratingTo}`,
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="migrating-from" className="block text-sm font-medium text-muted-300">
              Migrating from
            </label>
            <input
              id="migrating-from"
              type="text"
              value={migratingFrom}
              onChange={(e) => setMigratingFrom(e.target.value)}
              placeholder="e.g. .NET 6"
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white placeholder:text-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="migrating-to" className="block text-sm font-medium text-muted-300">
              Migrating to
            </label>
            <input
              id="migrating-to"
              type="text"
              value={migratingTo}
              onChange={(e) => setMigratingTo(e.target.value)}
              placeholder="e.g. .NET 8"
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white placeholder:text-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <CharLimitedInput
          id="code-input"
          value={code}
          onChange={setCode}
          maxLength={5000}
          placeholder="Paste relevant code or project files..."
          disabled={loading}
          rows={10}
          label="Paste relevant code or project files"
        />

        <button
          type="submit"
          disabled={loading || !code.trim() || !migratingFrom.trim() || !migratingTo.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Planning..." : "Plan Migration"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} credits used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <MigrationResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="upgrade-assistant"
              language={stack?.language ?? ""}
              framework={stack?.framework ?? ""}
              payload={{
                migratingFrom,
                migratingTo,
                steps: result.migrationSteps.length,
              }}
            />
            {showFifthUseCard && <InlineFeedbackCard toolName="upgrade-assistant" />}
          </>
        )}
      </div>
    </div>
  );
}
