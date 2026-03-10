import type { WebhookBuilderResult } from "@/lib/claude";

export function WebhookBuilderResultCards({ result }: { result: WebhookBuilderResult }) {
  return (
    <div className="mt-8 space-y-4">
      {/* Source Setup */}
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Source Setup
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-300">
          {result.sourceSetup.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <div className="mt-3 space-y-2">
          <div>
            <span className="text-xs font-medium uppercase text-muted-500">Webhook URL</span>
            <p className="mt-0.5 rounded bg-surface-800 px-3 py-1.5 text-sm font-mono text-brand-300">
              {result.sourceSetup.webhookUrl}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase text-muted-500">Authentication</span>
            <p className="mt-0.5 text-sm text-muted-300">{result.sourceSetup.authentication}</p>
          </div>
        </div>
      </div>

      {/* Target Setup */}
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Target Setup
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-300">
          {result.targetSetup.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        {result.targetSetup.endpointCode && (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-800 p-4 text-xs text-muted-300 font-mono">
            <code>{result.targetSetup.endpointCode}</code>
          </pre>
        )}
      </div>

      {/* Payload Format */}
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Payload Format
        </h3>
        <p className="mt-2 text-sm text-muted-300">{result.payloadFormat.description}</p>
        {result.payloadFormat.exampleFields.length > 0 && (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="py-2 pr-4 text-left font-medium text-muted-400">Field</th>
                <th className="py-2 text-left font-medium text-muted-400">Description</th>
              </tr>
            </thead>
            <tbody>
              {result.payloadFormat.exampleFields.map((field) => (
                <tr key={field.field} className="border-b border-surface-700/50">
                  <td className="py-2 pr-4 font-mono text-brand-300">{field.field}</td>
                  <td className="py-2 text-muted-300">{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Testing */}
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Testing
        </h3>
        <ul className="mt-2 space-y-1">
          {result.testing.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-300">
              <span className="mt-0.5 text-muted-500">&#9744;</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Security Notes */}
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Security Notes
        </h3>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {result.securityNotes.map((note, i) => (
            <li key={i} className="text-sm text-muted-300">{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
