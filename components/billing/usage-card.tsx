import Link from "next/link";
import { FREE_MONTHLY_LIMIT, USAGE_WARNING_THRESHOLD, USAGE_DANGER_THRESHOLD } from "@/lib/constants";

type Props = {
  isPro: boolean;
  usageCount: number;
};

export function UsageCard({ isPro, usageCount }: Props) {
  if (isPro) {
    return (
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Usage
        </h3>
        <p className="mt-2 text-lg font-semibold text-white">Unlimited</p>
        <p className="mt-1 text-xs text-muted-500">Pro plan — no limits</p>
      </div>
    );
  }

  const percentage = Math.min((usageCount / FREE_MONTHLY_LIMIT) * 100, 100);
  const barColor =
    usageCount >= USAGE_DANGER_THRESHOLD
      ? "bg-red-500"
      : usageCount >= USAGE_WARNING_THRESHOLD
        ? "bg-amber-500"
        : "bg-green-500";

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
        Usage
      </h3>
      <p className="mt-2 text-lg font-semibold text-white">
        {usageCount} / {FREE_MONTHLY_LIMIT}
      </p>
      <div className="mt-3 h-2 w-full rounded-full bg-surface-700">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-500">
        Free lookups used this month
      </p>
      {usageCount >= USAGE_WARNING_THRESHOLD && (
        <Link
          href="/upgrade"
          className="mt-3 inline-block text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          Upgrade to Pro for unlimited access
        </Link>
      )}
    </div>
  );
}
