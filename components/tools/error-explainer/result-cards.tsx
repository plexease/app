import type { ErrorExplainerResult } from "@/lib/claude";

export function ErrorExplainerResultCards({ result }: { result: ErrorExplainerResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Root Cause
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.rootCause}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Fix Suggestions
        </h3>
        {result.fixSuggestions.length > 0 ? (
          <ul className="mt-2 list-disc list-inside space-y-1">
            {result.fixSuggestions.map((suggestion) => (
              <li key={suggestion} className="text-sm text-muted-300">{suggestion}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No fix suggestions available.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Related Documentation
        </h3>
        {result.relatedDocs.length > 0 ? (
          <ul className="mt-2 list-disc list-inside space-y-1">
            {result.relatedDocs.map((doc) => (
              <li key={doc} className="text-sm text-muted-300">{doc}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No related documentation found.</p>
        )}
      </div>
    </div>
  );
}
