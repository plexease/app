import { getUsageLimit } from "@/lib/constants";

type Props = {
  plan: "free" | "essentials" | "pro";
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
