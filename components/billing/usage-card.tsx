import Link from "next/link";
import type { PlanTier } from "@/lib/subscription";
import {
  getUsageLimit,
  FREE_USAGE_WARNING,
  FREE_USAGE_DANGER,
  ESSENTIALS_USAGE_WARNING,
  ESSENTIALS_USAGE_DANGER,
  PRO_USAGE_WARNING,
  PRO_USAGE_DANGER,
} from "@/lib/constants";

type Props = {
  plan: PlanTier;
  usageCount: number;
};

function getThresholds(plan: PlanTier) {
  switch (plan) {
    case "pro": return { warning: PRO_USAGE_WARNING, danger: PRO_USAGE_DANGER };
    case "essentials": return { warning: ESSENTIALS_USAGE_WARNING, danger: ESSENTIALS_USAGE_DANGER };
    default: return { warning: FREE_USAGE_WARNING, danger: FREE_USAGE_DANGER };
  }
}

export function UsageCard({ plan, usageCount }: Props) {
  const limit = getUsageLimit(plan);
  const { warning, danger } = getThresholds(plan);
  const percentage = Math.min((usageCount / limit) * 100, 100);
  const barColor =
    usageCount >= danger
      ? "bg-red-500"
      : usageCount >= warning
        ? "bg-amber-500"
        : "bg-green-500";

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
        Usage
      </h3>
      <p className="mt-2 text-lg font-semibold text-white">
        {usageCount} / {limit}
      </p>
      <div className="mt-3 h-2 w-full rounded-full bg-surface-700">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-500">
        Credits used this month
      </p>
      {plan === "free" && usageCount >= warning && (
        <Link
          href="/upgrade"
          className="mt-3 inline-block text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          Upgrade for more access
        </Link>
      )}
    </div>
  );
}
