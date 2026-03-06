type Props = {
  plan: "free" | "pro";
};

export function TierBadge({ plan }: Props) {
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
        Pro
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-300">
      Free
    </span>
  );
}
