"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CancellationFeedback({
  periodEnd,
}: {
  periodEnd: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formattedDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  async function clearFlag() {
    try {
      await fetch("/api/feedback/clear-cancellation", { method: "POST" });
    } catch {
      // Non-critical
    }
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          trigger_type: "cancellation",
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success("Thanks for the feedback!");
        await clearFlag();
        router.push("/dashboard");
      }
    } catch {
      toast.error("Failed to send feedback");
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    await clearFlag();
    router.push("/dashboard");
  }

  if (submitted) return null;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-heading text-2xl font-bold text-white">
        Sorry to see you go
      </h1>
      {formattedDate && (
        <p className="mt-2 text-muted-400">
          Your access continues until {formattedDate}.
        </p>
      )}

      <div className="mt-8">
        <label
          htmlFor="cancellation-feedback"
          className="block text-sm font-medium text-muted-300"
        >
          What could we have done better?
        </label>
        <textarea
          id="cancellation-feedback"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your feedback helps us improve..."
          maxLength={2000}
          rows={4}
          className="mt-2 w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-white placeholder-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Sending..." : "Send feedback"}
        </button>
        <button
          onClick={handleSkip}
          className="text-sm text-muted-400 hover:text-white transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
