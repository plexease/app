import Link from "next/link";
import { FREE_MONTHLY_LIMIT, USAGE_WARNING_THRESHOLD, USAGE_DANGER_THRESHOLD } from "@/lib/constants";

type Props = {
  isPro: boolean;
  usageCount: number;
};

export function UsageCard({ isPro, usageCount }: Props) {
  if (isPro) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Usage
        </h3>
        <p className="mt-2 text-lg font-semibold text-white">Unlimited</p>
        <p className="mt-1 text-xs text-gray-500">Pro plan — no limits</p>
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
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Usage
      </h3>
      <p className="mt-2 text-lg font-semibold text-white">
        {usageCount} / {FREE_MONTHLY_LIMIT}
      </p>
      <div className="mt-3 h-2 w-full rounded-full bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Free lookups used this month
      </p>
      {usageCount >= USAGE_WARNING_THRESHOLD && (
        <Link
          href="/upgrade"
          className="mt-3 inline-block text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          Upgrade to Pro for unlimited access
        </Link>
      )}
    </div>
  );
}
