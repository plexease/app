"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleSend() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          trigger_type: "manual",
        }),
      });
      if (res.ok) {
        toast.success("Thanks for the feedback!");
        setText("");
        setOpen(false);
      }
    } catch {
      toast.error("Failed to send feedback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-muted-400 hover:bg-surface-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        Feedback
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-72 rounded-lg border border-surface-700 bg-surface-900 p-4 shadow-lg z-50">
          <h3 className="font-heading text-sm font-semibold text-white">
            How can we improve?
          </h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your feedback..."
            maxLength={2000}
            rows={3}
            className="mt-3 w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-white placeholder-muted-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setText("");
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!text.trim() || loading}
              className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
