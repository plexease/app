import type { CodeExplainerResult } from "@/lib/claude";

export function CodeExplainerResultCards({ result }: { result: CodeExplainerResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Explanation
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.explanation}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Detected packages
          </h3>
          {result.detectedPackages.length > 0 ? (
            <ul className="mt-2 list-disc list-inside space-y-1">
              {result.detectedPackages.map((pkg) => (
                <li key={pkg} className="text-sm text-muted-300">{pkg}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-500">No packages detected.</p>
          )}
        </div>

        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Detected patterns
          </h3>
          {result.detectedPatterns.length > 0 ? (
            <ul className="mt-2 list-disc list-inside space-y-1">
              {result.detectedPatterns.map((pattern) => (
                <li key={pattern} className="text-sm text-muted-300">{pattern}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-500">No specific patterns detected.</p>
          )}
        </div>
      </div>
    </div>
  );
}
