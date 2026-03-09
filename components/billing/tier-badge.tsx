import type { PlanTier } from "@/lib/subscription";

type Props = {
  plan: PlanTier;
};

export function TierBadge({ plan }: Props) {
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold text-white">
        Pro
      </span>
    );
  }

  if (plan === "essentials") {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-500/60 px-2.5 py-0.5 text-xs font-semibold text-white">
        Essentials
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-surface-700 px-2.5 py-0.5 text-xs font-semibold text-muted-300">
      Free
    </span>
  );
}
