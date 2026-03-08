"use client";

import { useState, useEffect } from "react";
import { GeneratorResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { loadWorkflowContext } from "@/lib/workflow-context";
import type { CodeGeneratorResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

const ACCEPTED_FROM = ["integration-planner", "package-advisor", "migration-assistant"];

type Props = {
  usageCount: number;
  isPro: boolean;
};

export function GeneratorForm({ usageCount, isPro }: Props) {
  const [spec, setSpec] = useState("");
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeGeneratorResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);

  const limitReached = !isPro && currentUsage >= FREE_MONTHLY_LIMIT;

  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
      const parts: string[] = [];
      if (ctx.payload.approach) parts.push(String(ctx.payload.approach));
      if (ctx.payload.packages) {
        const pkgs = ctx.payload.packages as { name: string; purpose: string }[];
        parts.push(`Packages: ${pkgs.map((p) => p.name).join(", ")}`);
      }
      if (parts.length > 0) setSpec(parts.join("\n\n").slice(0, 2000));
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
      const res = await fetch("/api/tools/code-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, language: stack.language, framework: stack.framework }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) setCurrentUsage(FREE_MONTHLY_LIMIT);
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
    return (
      <div className="rounded-lg border border-yellow-700 bg-yellow-950/30 p-6 text-center">
        <p className="text-sm font-medium text-yellow-300">
          You&apos;ve used all {FREE_MONTHLY_LIMIT} free lookups this month.
        </p>
        <p className="mt-1 text-sm text-muted-400">Upgrade to Pro for unlimited access.</p>
        <a href="/upgrade" className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
          Upgrade to Pro
        </a>
      </div>
    );
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
          id="spec-input"
          value={spec}
          onChange={setSpec}
          maxLength={2000}
          placeholder='e.g. "Generate a Stripe webhook handler with signature verification and subscription lifecycle events"'
          disabled={loading}
          rows={4}
          label="What code do you need?"
          hint="Describe the integration code you want generated. Be specific about features and patterns."
        />

        <button
          type="submit"
          disabled={loading || !spec.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Generating..." : "Generate Code"}
        </button>
      </form>

      {!isPro && (
        <p className="mt-2 text-xs text-muted-500">
          {currentUsage} of {FREE_MONTHLY_LIMIT} free lookups used this month
        </p>
      )}

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && <GeneratorResultCards result={result} />}
      </div>
    </div>
  );
}
