import type { ToolPlannerResult } from "@/lib/claude";

const complexityColors: Record<string, string> = {
  low: "bg-green-900/40 text-green-300 border-green-700",
  medium: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  high: "bg-red-900/40 text-red-300 border-red-700",
};

export function ToolPlannerResultCards({ result }: { result: ToolPlannerResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Recommended Tools
        </h3>
        {result.recommendations.length > 0 ? (
          <div className="mt-3 space-y-3">
            {result.recommendations.map((tool) => (
              <div
                key={tool.name}
                className="flex items-start justify-between gap-4 rounded-lg border border-surface-700 bg-surface-800 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{tool.name}</p>
                  <p className="mt-1 text-sm text-muted-300">{tool.purpose}</p>
                  <p className="mt-1 text-xs text-muted-500">{tool.cost}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${complexityColors[tool.integrationComplexity] ?? complexityColors.medium}`}
                >
                  {tool.integrationComplexity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No recommendations found.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Stack Overview
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.stackOverview}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Implementation Order
        </h3>
        {result.implementationOrder.length > 0 ? (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-300">
            {result.implementationOrder.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No implementation steps provided.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Considerations
        </h3>
        {result.considerations.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-300">
            {result.considerations.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No additional considerations.</p>
        )}
      </div>
    </div>
  );
}
