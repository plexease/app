"use client";

import { useState } from "react";
import { toast } from "sonner";

export function InlineFeedbackCard({ toolName }: { toolName: string }) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (submitted || dismissed) return null;

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          trigger_type: "fifth_use",
          tool_name: toolName,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success("Thanks for the feedback!");
      }
    } catch {
      toast.error("Failed to send feedback");
    } finally {
      setLoading(false);
    }
  }

  async function handleDismiss() {
    try {
      await fetch("/api/feedback/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger_type: "fifth_use" }),
      });
    } catch {
      // Silent fail — dismissal is non-critical
    }
    setDismissed(true);
  }

  return (
    <div className="mt-6 rounded-lg border border-brand-500/30 bg-brand-500/10 p-4">
      <div className="flex items-start justify-between">
        <p className="text-sm text-brand-300">
          Quick thought? Help us improve — totally optional
        </p>
        <button
          onClick={handleDismiss}
          className="ml-2 text-muted-500 hover:text-muted-300 transition-colors"
          aria-label="Dismiss feedback"
        >
          &times;
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What could be better?"
          maxLength={2000}
          className="flex-1 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-white placeholder-muted-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
