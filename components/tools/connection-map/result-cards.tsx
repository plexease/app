import type { ConnectionMapResult } from "@/lib/claude";

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

export function ConnectionMapResultCards({ result }: { result: ConnectionMapResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Connections
        </h3>
        {result.connections.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-left text-xs text-muted-500">
                  <th className="pb-2 pr-4">From</th>
                  <th className="pb-2 pr-4">To</th>
                  <th className="pb-2 pr-4">Data Flow</th>
                  <th className="pb-2">Method</th>
                </tr>
              </thead>
              <tbody>
                {result.connections.map((conn, i) => (
                  <tr key={i} className="border-b border-surface-800">
                    <td className="py-2 pr-4 text-muted-300">{conn.from}</td>
                    <td className="py-2 pr-4 text-muted-300">{conn.to}</td>
                    <td className="py-2 pr-4 text-muted-300">{conn.dataFlow}</td>
                    <td className="py-2 text-muted-300">{conn.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No connections found.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Weak Points
        </h3>
        {result.weakPoints.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {result.weakPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-0.5 inline-block shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${severityColors[point.severity] ?? ""}`}>
                  {severityLabels[point.severity] ?? point.severity}
                </span>
                <div>
                  <p className="text-sm text-muted-300">{point.description}</p>
                  {point.recommendation && (
                    <p className="mt-1 text-xs text-muted-500">{point.recommendation}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No weak points identified.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Overall Assessment
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.overallAssessment}</p>
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
