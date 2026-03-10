import type { WhatChangedResult } from "@/lib/claude";

const impactColour: Record<string, string> = {
  breaking: "bg-red-500/20 text-red-400",
  degraded: "bg-orange-500/20 text-orange-400",
  cosmetic: "bg-yellow-500/20 text-yellow-400",
  none: "bg-green-500/20 text-green-400",
};

const urgencyColour: Record<string, string> = {
  immediate: "bg-red-500/20 text-red-400",
  soon: "bg-yellow-500/20 text-yellow-400",
  when_convenient: "bg-green-500/20 text-green-400",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label.replace("_", " ")}
    </span>
  );
}

export function WhatChangedResultCards({ result }: { result: WhatChangedResult }) {
  return (
    <div className="mt-8 space-y-4">
      {/* Affected Integrations */}
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Affected Integrations
        </h3>
        <ul className="mt-3 space-y-3">
          {result.affectedIntegrations.map((item) => (
            <li key={item.integration} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{item.integration}</span>
                <Badge label={item.impact} className={impactColour[item.impact] ?? ""} />
              </div>
              <p className="text-sm text-muted-300">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Priority Order */}
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Priority Order
        </h3>
        <ul className="mt-3 space-y-3">
          {result.priorityOrder.map((item) => (
            <li key={item.item} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{item.item}</span>
                <Badge label={item.urgency} className={urgencyColour[item.urgency] ?? ""} />
              </div>
              <p className="text-sm text-muted-300">{item.effort}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Migration Steps */}
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Migration Steps
        </h3>
        <ol className="mt-3 list-decimal list-inside space-y-1">
          {result.migrationSteps.map((step, i) => (
            <li key={i} className="text-sm text-muted-300">{step}</li>
          ))}
        </ol>
      </div>

      {/* Workarounds */}
      {result.workarounds.length > 0 && (
        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Workarounds
          </h3>
          <ul className="mt-3 list-disc list-inside space-y-1">
            {result.workarounds.map((w, i) => (
              <li key={i} className="text-sm text-muted-300">{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
