"use client";

import { useState, useEffect } from "react";
import { AuditResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { loadWorkflowContext } from "@/lib/workflow-context";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { DependencyAuditResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

const ACCEPTED_FROM = ["unit-test-generator", "how-it-works"];

type Props = {
  usageCount: number;
  plan: PlanTier;
};

export function AuditForm({ usageCount, plan }: Props) {
  const [dependencyFile, setDependencyFile] = useState("");
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DependencyAuditResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
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
      const res = await fetch("/api/tools/compatibility-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dependencyFile, language: stack.language, framework: stack.framework }),
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
          id="dependency-input"
          value={dependencyFile}
          onChange={setDependencyFile}
          maxLength={5000}
          placeholder="Paste your package.json, .csproj, requirements.txt, or go.mod here..."
          disabled={loading}
          rows={10}
          label="Dependency file"
          hint="Paste the contents of your dependency manifest file."
        />

        <button
          type="submit"
          disabled={loading || !dependencyFile.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Auditing..." : "Audit Dependencies"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && <AuditResultCards result={result} />}
      </div>
    </div>
  );
}
