import type { NuGetAdvisorResult } from "@/lib/claude";

export function ResultCards({ result }: { result: NuGetAdvisorResult }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          What it does
        </h3>
        <p className="mt-2 text-sm text-gray-300">{result.whatItDoes}</p>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Alternatives
        </h3>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {result.alternatives.map((alt) => (
            <li key={alt} className="text-sm text-gray-300">
              {alt}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Compatibility
        </h3>
        <p className="mt-2 text-sm text-gray-300">{result.compatibility}</p>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Version advice
        </h3>
        <p className="mt-2 text-sm text-gray-300">{result.versionAdvice}</p>
      </div>
    </div>
  );
}
