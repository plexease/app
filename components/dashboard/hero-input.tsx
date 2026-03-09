"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { matchKeywords } from "@/lib/tool-router";
import { TOOL_CATALOG } from "@/lib/tool-descriptions";

export function HeroInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setError(null);

    // Layer 1: Client-side keyword matching
    const keywordMatch = matchKeywords(query);
    if (keywordMatch && keywordMatch.confidence === "high") {
      const tool = TOOL_CATALOG[keywordMatch.tool];
      if (tool) {
        router.push(tool.href);
        return;
      }
    }

    // Layer 2: Claude fallback
    setLoading(true);
    try {
      const res = await fetch("/api/tools/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.rateLimited) {
          setError("rate_limited");
          return;
        }
        setError("fallback");
        return;
      }

      const data = await res.json();
      const tool = TOOL_CATALOG[data.tool as keyof typeof TOOL_CATALOG];
      if (tool) {
        router.push(tool.href);
        return;
      }

      // Tool not found in catalog — show fallback
      setError("fallback");
    } catch {
      setError("fallback");
    } finally {
      setLoading(false);
    }
  };

  if (error === "rate_limited") {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-400">
          You&apos;ve reached the daily routing limit. Try browsing by category instead.
        </p>
        <button
          onClick={() => setError(null)}
          className="mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="hero-input" className="sr-only">
          What do you need help with?
        </label>
        <div className="relative">
          <input
            id="hero-input"
            type="text"
            placeholder="What do you need help with?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            disabled={loading}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-white placeholder-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-surface-700 border-t-brand-500"
                role="status"
                aria-label="Loading"
              />
              <span className="text-xs text-muted-400">Finding the right tool...</span>
            </div>
          )}
        </div>
      </form>

      {error === "fallback" && (
        <p className="mt-2 text-sm text-muted-400">
          We weren&apos;t sure what you need — try one of the options below.
        </p>
      )}
    </div>
  );
}
