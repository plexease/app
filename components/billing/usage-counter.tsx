import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

type Props = {
  isPro: boolean;
  usageCount: number;
};

export function UsageCounter({ isPro, usageCount }: Props) {
  if (isPro) {
    return <p className="text-xs text-muted-500">Unlimited</p>;
  }

  return (
    <p className="text-xs text-muted-500">
      {usageCount}/{FREE_MONTHLY_LIMIT} uses
    </p>
  );
}
