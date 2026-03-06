"use client";

import { useState } from "react";
import { ResultCards } from "./result-cards";
import type { NuGetAdvisorResult } from "@/lib/claude";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

type Props = {
  usageCount: number;
  isPro: boolean;
};

export function AdvisorForm({ usageCount, isPro }: Props) {
  const [packageName, setPackageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NuGetAdvisorResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);

  const limitReached = !isPro && currentUsage >= FREE_MONTHLY_LIMIT;

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
          setCurrentUsage(FREE_MONTHLY_LIMIT);
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
    return (
      <div className="rounded-lg border border-yellow-700 bg-yellow-950/30 p-6 text-center">
        <p className="text-sm font-medium text-yellow-300">
          You&apos;ve used all 20 free lookups this month.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Upgrade to Pro for unlimited access.
        </p>
        <a
          href="/upgrade"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Upgrade to Pro
        </a>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="package-name" className="block text-sm font-medium text-gray-300">
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
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !packageName.trim()}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Analysing..." : "Analyse"}
        </button>
      </form>

      {!isPro && (
        <p className="mt-2 text-xs text-gray-500">
          {currentUsage} of {FREE_MONTHLY_LIMIT} free lookups used this month
        </p>
      )}

      <div aria-live="polite">
        {error && (
          <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>
        )}

        {result && <ResultCards result={result} />}
      </div>
    </div>
  );
}
