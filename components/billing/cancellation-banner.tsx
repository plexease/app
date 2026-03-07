"use client";

import { useState } from "react";

type Props = {
  state: "cancelled" | "grace" | null;
  periodEndDate: string | null;
  gracePeriodEndDate: string | null;
  onResubscribe: () => void;
  resubscribing: boolean;
};

export function CancellationBanner({
  state,
  periodEndDate,
  gracePeriodEndDate,
  onResubscribe,
  resubscribing,
}: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!state || dismissed) return null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (state === "grace") {
    return (
      <div className="mb-6 flex items-center justify-between rounded-lg border border-red-700 bg-red-950/30 px-4 py-3">
        <p className="text-sm text-red-300">
          Your Pro access expires tomorrow. Resubscribe to keep unlimited access.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onResubscribe}
            disabled={resubscribing}
            className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {resubscribing ? "Resubscribing..." : "Resubscribe"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-500 hover:text-muted-300 transition-colors"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      </div>
    );
  }

  // cancelled state (still in paid period)
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-700 bg-amber-950/30 px-4 py-3">
      <p className="text-sm text-amber-300">
        Your Pro plan is cancelled. Access continues until{" "}
        {periodEndDate ? formatDate(periodEndDate) : "the end of your billing period"}.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onResubscribe}
          disabled={resubscribing}
          className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {resubscribing ? "Resubscribing..." : "Resubscribe"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-500 hover:text-muted-300 transition-colors"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
