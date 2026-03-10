import type { IntegrationPlannerResult } from "@/lib/claude";

export function PlannerResultCards({ result }: { result: IntegrationPlannerResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Recommended approach
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.approach}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Recommended packages
        </h3>
        {result.recommendedPackages.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {result.recommendedPackages.map((pkg) => (
              <li key={pkg.name} className="text-sm">
                <span className="font-medium text-white">{pkg.name}</span>
                <span className="text-muted-400"> — {pkg.purpose}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No specific packages recommended.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Architecture overview
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.architectureOverview}</p>
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
