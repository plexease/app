"use client";

import { useState } from "react";
import { ResultCards } from "./result-cards";
import { LimitReachedCard } from "@/components/shared/limit-reached-card";
import type { NuGetAdvisorResult } from "@/lib/claude";
import { getUsageLimit } from "@/lib/constants";

type Props = {
  usageCount: number;
  plan: "free" | "essentials" | "pro";
};

export function AdvisorForm({ usageCount, plan }: Props) {
  const [packageName, setPackageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NuGetAdvisorResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);

  const limit = getUsageLimit(plan);
  const limitReached = currentUsage >= limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/nuget-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageName }),
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

  return (
    <div>
      <label htmlFor="package-name" className="block text-sm font-medium text-muted-300">
        Package name
      </label>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          id="package-name"
          type="text"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          placeholder="e.g. Newtonsoft.Json"
          required
          disabled={loading}
          className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-white placeholder-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !packageName.trim()}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Analysing..." : "Analyse"}
        </button>
      </form>

      <p className="mt-2 text-xs text-muted-500">
        {currentUsage} of {limit} lookups used this month
      </p>

      <div aria-live="polite">
        {error && (
          <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>
        )}

        {result && <ResultCards result={result} />}
      </div>
    </div>
  );
}
