import type { WorkflowBuilderResult } from "@/lib/claude";

function complexityColor(complexity: "low" | "medium" | "high"): string {
  switch (complexity) {
    case "low": return "bg-green-500/20 text-green-400";
    case "medium": return "bg-yellow-500/20 text-yellow-400";
    case "high": return "bg-red-500/20 text-red-400";
  }
}

export function BuilderResultCards({ result }: { result: WorkflowBuilderResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Trigger
        </h3>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-white">
            <span className="text-muted-400">Event:</span> {result.trigger.event}
          </p>
          <p className="text-sm text-white">
            <span className="text-muted-400">Platform:</span> {result.trigger.platform}
          </p>
          {result.trigger.conditions.length > 0 && (
            <div>
              <span className="text-sm text-muted-400">Conditions:</span>
              <ul className="mt-1 list-disc list-inside space-y-1">
                {result.trigger.conditions.map((condition) => (
                  <li key={condition} className="text-sm text-muted-300">{condition}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Workflow Steps
        </h3>
        <ol className="mt-2 space-y-3">
          {result.steps.map((step) => (
            <li key={step.step} className="text-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-medium text-brand-400">
                  {step.step}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {step.action}
                    <span className="ml-2 inline-block rounded-full bg-surface-700 px-2 py-0.5 text-xs text-muted-300">
                      {step.platform}
                    </span>
                  </p>
                  <p className="mt-1 text-muted-300">{step.details}</p>
                  <p className="mt-1 text-xs text-muted-500">
                    Error handling: {step.errorHandling}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Implementation Options
        </h3>
        <div className="mt-2 space-y-3">
          {result.implementationOptions.map((option) => (
            <div key={option.method} className="rounded-lg border border-surface-700 bg-surface-800 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{option.method}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${complexityColor(option.complexity)}`}>
                  {option.complexity}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-300">{option.description}</p>
              <p className="mt-1 text-xs text-muted-500">Cost: {option.cost}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Estimated Setup Time
        </h3>
        <span className="mt-2 inline-block rounded-full bg-brand-500/20 px-3 py-1 text-sm font-medium text-brand-400">
          {result.estimatedSetupTime}
        </span>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Considerations
        </h3>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {result.considerations.map((item) => (
            <li key={item} className="text-sm text-muted-300">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
