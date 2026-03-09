export function LimitReachedCard() {
  return (
    <div className="rounded-lg border border-yellow-700 bg-yellow-950/30 p-6 text-center">
      <p className="text-sm font-medium text-yellow-300">
        You&apos;ve reached your monthly usage limit.
      </p>
      <p className="mt-1 text-sm text-muted-400">Upgrade your plan for more access.</p>
      <a
        href="/upgrade"
        className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
      >
        Upgrade
      </a>
    </div>
  );
}
