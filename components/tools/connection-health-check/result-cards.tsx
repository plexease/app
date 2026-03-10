import type { HealthCheckerResult } from "@/lib/claude";

const severityColors: Record<string, string> = {
  critical: "text-red-400 bg-red-950/30 border-red-700",
  warning: "text-yellow-400 bg-yellow-950/30 border-yellow-700",
  info: "text-blue-400 bg-blue-950/30 border-blue-700",
};

const severityLabels: Record<string, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export function HealthCheckerResultCards({ result }: { result: HealthCheckerResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Configuration Status
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.configurationStatus}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Issues
        </h3>
        {result.issues.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-left text-xs text-muted-500">
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2 pr-4">Description</th>
                  <th className="pb-2">Fix</th>
                </tr>
              </thead>
              <tbody>
                {result.issues.map((issue, i) => (
                  <tr key={i} className="border-b border-surface-800">
                    <td className="py-2 pr-4">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${severityColors[issue.severity] ?? ""}`}>
                        {severityLabels[issue.severity] ?? issue.severity}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-300">{issue.description}</td>
                    <td className="py-2 text-muted-300">{issue.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No issues found — looking healthy!</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Recommendations
        </h3>
        {result.recommendations.length > 0 ? (
          <ul className="mt-2 list-disc list-inside space-y-1">
            {result.recommendations.map((rec) => (
              <li key={rec} className="text-sm text-muted-300">{rec}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No additional recommendations.</p>
        )}
      </div>
    </div>
  );
}
