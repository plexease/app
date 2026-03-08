import type { UnitTestGeneratorResult } from "@/lib/claude";
import { CopyButton } from "@/components/shared/copy-button";

export function UnitTestResultCards({ result }: { result: UnitTestGeneratorResult }) {
  return (
    <div className="mt-8 space-y-4">
      {result.files.map((file) => (
        <div key={file.filename} className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold text-white">{file.filename}</h3>
            <CopyButton text={file.code} />
          </div>
          <p className="mt-1 text-xs text-muted-500">{file.description}</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-950 p-4 text-xs text-muted-300 font-mono">
            <code>{file.code}</code>
          </pre>
        </div>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Test Framework
          </h3>
          <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.testFramework}</p>
        </div>

        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Mocking Approach
          </h3>
          <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.mockingApproach}</p>
        </div>
      </div>
    </div>
  );
}
