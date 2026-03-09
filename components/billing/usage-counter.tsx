import { getUsageLimit } from "@/lib/constants";
import type { PlanTier } from "@/lib/subscription";

type Props = {
  plan: PlanTier;
  usageCount: number;
};

export function UsageCounter({ plan, usageCount }: Props) {
  const limit = getUsageLimit(plan);

  return (
    <p className="text-xs text-muted-500">
      {usageCount}/{limit} uses
    </p>
  );
}
