import type { IntegrationSetupResult } from "@/lib/claude";

export function IntegrationSetupResultCards({ result }: { result: IntegrationSetupResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Prerequisites
        </h3>
        <ul className="mt-2 space-y-1">
          {result.prerequisites.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-300">
              <span className="mt-0.5 text-brand-400">&#10003;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
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
                <span className="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-muted-300">
                  {step.platform}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Verification
        </h3>
        <ul className="mt-2 space-y-1">
          {result.verificationSteps.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-300">
              <span className="mt-0.5 text-brand-400">&#10003;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Common Pitfalls
        </h3>
        <div className="mt-2 space-y-3">
          {result.commonPitfalls.map((pitfall) => (
            <div key={pitfall.issue}>
              <p className="text-sm font-medium text-red-400">{pitfall.issue}</p>
              <p className="mt-0.5 text-sm text-muted-300">{pitfall.prevention}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Estimated Time
        </h3>
        <span className="mt-2 inline-block rounded-full bg-brand-500/20 px-3 py-1 text-sm font-medium text-brand-400">
          {result.estimatedTime}
        </span>
      </div>
    </div>
  );
}
