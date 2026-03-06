"use client";

type Props = {
  onManageBilling: () => void;
  loading: boolean;
};

export function PaymentFailedBanner({ onManageBilling, loading }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-red-700 bg-red-950/30 px-4 py-3">
      <p className="text-sm text-red-300">
        Payment failed. Please update your payment method to keep your Pro access.
      </p>
      <button
        onClick={onManageBilling}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Opening..." : "Update payment method"}
      </button>
    </div>
  );
}
