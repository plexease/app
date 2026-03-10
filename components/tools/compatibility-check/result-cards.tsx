import type { DependencyAuditResult } from "@/lib/claude";

const statusColors: Record<string, string> = {
  "up-to-date": "text-green-400 bg-green-950/30 border-green-700",
  "outdated": "text-yellow-400 bg-yellow-950/30 border-yellow-700",
  "vulnerable": "text-red-400 bg-red-950/30 border-red-700",
  "deprecated": "text-muted-400 bg-surface-800 border-surface-700",
};

const statusLabels: Record<string, string> = {
  "up-to-date": "Up to date",
  "outdated": "Outdated",
  "vulnerable": "Vulnerable",
  "deprecated": "Deprecated",
};

export function AuditResultCards({ result }: { result: DependencyAuditResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Summary
        </h3>
        <p className="mt-2 text-sm text-muted-300">{result.summary}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Dependencies
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left text-xs text-muted-500">
                <th className="pb-2 pr-4">Package</th>
                <th className="pb-2 pr-4">Current</th>
                <th className="pb-2 pr-4">Latest</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {result.dependencies.map((dep) => (
                <tr key={dep.name} className="border-b border-surface-800">
                  <td className="py-2 pr-4 font-medium text-white">{dep.name}</td>
                  <td className="py-2 pr-4 font-mono text-muted-300">{dep.currentVersion}</td>
                  <td className="py-2 pr-4 font-mono text-muted-300">{dep.latestVersion}</td>
                  <td className="py-2 pr-4">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[dep.status] ?? ""}`}>
                      {statusLabels[dep.status] ?? dep.status}
                    </span>
                  </td>
                  <td className="py-2 text-muted-400">{dep.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Recommendations
        </h3>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {result.recommendations.map((rec) => (
            <li key={rec} className="text-sm text-muted-300">{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
