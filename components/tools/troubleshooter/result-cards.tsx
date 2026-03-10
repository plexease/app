import type { TroubleshooterResult } from "@/lib/claude";

const categoryColors: Record<string, string> = {
  auth: "text-purple-400 bg-purple-950/30 border-purple-700",
  webhook: "text-blue-400 bg-blue-950/30 border-blue-700",
  mapping: "text-cyan-400 bg-cyan-950/30 border-cyan-700",
  rate_limit: "text-orange-400 bg-orange-950/30 border-orange-700",
  service_outage: "text-red-400 bg-red-950/30 border-red-700",
  configuration: "text-yellow-400 bg-yellow-950/30 border-yellow-700",
  other: "text-muted-400 bg-surface-800 border-surface-700",
};

const categoryLabels: Record<string, string> = {
  auth: "Authentication",
  webhook: "Webhook",
  mapping: "Data Mapping",
  rate_limit: "Rate Limit",
  service_outage: "Service Outage",
  configuration: "Configuration",
  other: "Other",
};

const confidenceColors: Record<string, string> = {
  high: "text-green-400 bg-green-950/30 border-green-700",
  medium: "text-yellow-400 bg-yellow-950/30 border-yellow-700",
  low: "text-red-400 bg-red-950/30 border-red-700",
};

const confidenceLabels: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function TroubleshooterResultCards({ result }: { result: TroubleshooterResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Likely Cause
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${categoryColors[result.likelyCause.category] ?? categoryColors.other}`}>
            {categoryLabels[result.likelyCause.category] ?? result.likelyCause.category}
          </span>
          <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${confidenceColors[result.likelyCause.confidence] ?? ""}`}>
            {confidenceLabels[result.likelyCause.confidence] ?? result.likelyCause.confidence}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-300 whitespace-pre-line">{result.likelyCause.explanation}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Diagnostic Steps
        </h3>
        {result.diagnosticSteps.length > 0 ? (
          <ol className="mt-3 space-y-4">
            {result.diagnosticSteps.map((ds) => (
              <li key={ds.step} className="text-sm text-muted-300">
                <p className="font-medium text-white">
                  {ds.step}. {ds.check}
                </p>
                <p className="mt-1 text-xs text-muted-400">
                  <span className="font-medium text-green-400">Expected:</span> {ds.expectedResult}
                </p>
                <p className="mt-0.5 text-xs text-muted-400">
                  <span className="font-medium text-red-400">If fails:</span> {ds.ifFails}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No diagnostic steps provided.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Fix Steps
        </h3>
        {result.fixSteps.length > 0 ? (
          <ol className="mt-2 list-decimal list-inside space-y-1">
            {result.fixSteps.map((step, i) => (
              <li key={i} className="text-sm text-muted-300">{step}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No fix steps provided.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Prevention Tips
        </h3>
        {result.preventionTips.length > 0 ? (
          <ul className="mt-2 list-disc list-inside space-y-1">
            {result.preventionTips.map((tip) => (
              <li key={tip} className="text-sm text-muted-300">{tip}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No prevention tips provided.</p>
        )}
      </div>
    </div>
  );
}
