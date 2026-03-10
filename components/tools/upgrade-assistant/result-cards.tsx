import type { MigrationAssistantResult } from "@/lib/claude";

export function MigrationResultCards({ result }: { result: MigrationAssistantResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Migration Steps
        </h3>
        <div className="mt-3 space-y-4">
          {result.migrationSteps.map((step) => (
            <div key={step.step} className="border-l-2 border-brand-500/30 pl-4">
              <div className="flex items-baseline gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">
                  {step.step}
                </span>
                <h4 className="text-sm font-semibold text-white">{step.title}</h4>
              </div>
              <p className="mt-1 text-sm text-muted-300">{step.description}</p>
              {step.codeChanges && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-950 p-3 text-xs text-muted-300 font-mono">
                  <code>{step.codeChanges}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {result.breakingChanges.length > 0 && (
        <div className="rounded-lg border border-red-700/50 bg-red-950/10 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-red-400">
            Breaking Changes
          </h3>
          <ul className="mt-2 list-disc list-inside space-y-1">
            {result.breakingChanges.map((change) => (
              <li key={change} className="text-sm text-red-300">{change}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Estimated Effort
        </h3>
        <p className="mt-2 text-sm text-muted-300">{result.estimatedEffort}</p>
      </div>
    </div>
  );
}
