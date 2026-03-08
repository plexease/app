"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveWorkflowContext } from "@/lib/workflow-context";

export interface WorkflowRecommendation {
  toolId: string;
  toolName: string;
  href: string;
  description: string; // Claude-generated context-aware copy
  contextSummary: string; // e.g. "Language: C#, Package: Stripe.NET"
}

type Props = {
  recommendations: WorkflowRecommendation[];
  sourceToolId: string;
  language: string;
  framework: string;
  payload: Record<string, unknown>;
};

export function WorkflowNext({ recommendations, sourceToolId, language, framework, payload }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);

  const handleClick = (rec: WorkflowRecommendation) => {
    setConfirming(rec.toolId);
  };

  const handleConfirm = (rec: WorkflowRecommendation) => {
    saveWorkflowContext({ sourceToolId, language, framework, payload });
    router.push(rec.href);
  };

  const handleCancel = () => {
    setConfirming(null);
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-8 rounded-lg border border-surface-700 bg-surface-900 p-5">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
        What&apos;s next?
      </h3>
      <div className="mt-3 space-y-3">
        {recommendations.map((rec) => (
          <div key={rec.toolId} className="rounded-lg border border-surface-700 bg-surface-800 p-4">
            <p className="text-sm text-muted-300">{rec.description}</p>
            <p className="mt-1 text-xs text-muted-500">{rec.contextSummary}</p>

            {confirming === rec.toolId ? (
              <div className="mt-3 flex gap-2">
                <p className="text-sm text-muted-300 self-center">
                  Pass this context to <strong className="text-white">{rec.toolName}</strong> and open it?
                </p>
                <button
                  onClick={() => handleConfirm(rec)}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-lg border border-surface-700 px-4 py-2 text-sm font-medium text-muted-300 hover:bg-surface-700 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleClick(rec)}
                className="mt-3 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                Open {rec.toolName} &rarr;
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
