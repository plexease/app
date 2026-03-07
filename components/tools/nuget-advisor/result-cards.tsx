import type { NuGetAdvisorResult } from "@/lib/claude";

export function ResultCards({ result }: { result: NuGetAdvisorResult }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          What it does
        </h3>
        <p className="mt-2 text-sm text-muted-300">{result.whatItDoes}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Alternatives
        </h3>
        {result.alternatives.length > 0 ? (
          <ul className="mt-2 list-disc list-inside space-y-1">
            {result.alternatives.map((alt) => (
              <li key={alt} className="text-sm text-muted-300">
                {alt}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-300">No well-known alternatives.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Compatibility
        </h3>
        <p className="mt-2 text-sm text-muted-300">{result.compatibility}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Version advice
        </h3>
        <p className="mt-2 text-sm text-muted-300">{result.versionAdvice}</p>
      </div>
    </div>
  );
}
