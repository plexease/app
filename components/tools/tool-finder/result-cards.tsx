import type { PackageAdvisorResult } from "@/lib/claude";

export function PackageAdvisorResultCards({ result }: { result: PackageAdvisorResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Recommendation
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.recommendation}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Alternatives
        </h3>
        {result.alternatives.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-left text-xs text-muted-500">
                  <th className="pb-2 pr-4">Package</th>
                  <th className="pb-2">Comparison</th>
                </tr>
              </thead>
              <tbody>
                {result.alternatives.map((alt) => (
                  <tr key={alt.name} className="border-b border-surface-800">
                    <td className="py-2 pr-4 font-medium text-white">{alt.name}</td>
                    <td className="py-2 text-muted-300">{alt.comparison}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No alternatives found.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Compatibility
          </h3>
          <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.compatibility}</p>
        </div>

        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Version Advice
          </h3>
          <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.versionAdvice}</p>
        </div>
      </div>
    </div>
  );
}
