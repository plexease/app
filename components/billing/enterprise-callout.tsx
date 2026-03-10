export function EnterpriseCallout() {
  return (
    <div className="rounded-lg border border-surface-700 bg-surface-900/50 p-6 text-center">
      <h3 className="font-heading text-lg font-semibold text-white">Need more?</h3>
      <p className="mt-2 text-sm text-muted-400">
        Enterprise plans offer custom credit limits, team accounts, and dedicated support.
      </p>
      <a
        href="mailto:hello@plexease.io"
        className="mt-4 inline-block rounded-lg border border-brand-500 px-5 py-2.5 text-sm font-medium text-brand-400 hover:bg-brand-500/10 transition-colors"
      >
        Contact us
      </a>
    </div>
  );
}
