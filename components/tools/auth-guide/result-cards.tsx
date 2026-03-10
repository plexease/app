import type { AuthGuideResult } from "@/lib/claude";

export function AuthGuideResultCards({ result }: { result: AuthGuideResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Auth Method
        </h3>
        <p className="mt-2 text-sm font-medium text-brand-400">{result.authMethod}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Setup Steps
        </h3>
        <div className="mt-3 space-y-4">
          {result.steps.map((step) => (
            <div key={step.step} className="border-l-2 border-brand-500/30 pl-4">
              <div className="flex items-baseline gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-400">
                  {step.step}
                </span>
                <h4 className="text-sm font-semibold text-white">{step.title}</h4>
              </div>
              <p className="mt-1 text-sm text-muted-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Security Tips
        </h3>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {result.securityTips.map((tip) => (
            <li key={tip} className="text-sm text-muted-300">{tip}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Testing Steps
        </h3>
        <ul className="mt-2 space-y-2">
          {result.testingSteps.map((step) => (
            <li key={step} className="flex items-start gap-2 text-sm text-muted-300">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-surface-600" />
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Common Errors
        </h3>
        <div className="mt-2 space-y-3">
          {result.commonErrors.map((item) => (
            <div key={item.error}>
              <p className="text-sm font-medium text-red-400">{item.error}</p>
              <p className="mt-1 text-sm text-muted-300">{item.fix}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
