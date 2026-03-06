"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CancellationBanner } from "@/components/billing/cancellation-banner";
import { PaymentFailedBanner } from "@/components/billing/payment-failed-banner";
import { UsageCard } from "@/components/billing/usage-card";
import { TierBadge } from "@/components/billing/tier-badge";
import type { UserPlan } from "@/lib/subscription";

type Props = {
  plan: UserPlan;
  usageCount: number;
};

export function DashboardContent({ plan, usageCount }: Props) {
  const router = useRouter();
  const [resubscribing, setResubscribing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPro = plan.plan === "pro";

  // Determine cancellation state
  let cancellationState: "cancelled" | "grace" | null = null;
  if (plan.cancelAtPeriodEnd) {
    cancellationState = "cancelled";
  } else if (plan.gracePeriodEnd && new Date() < new Date(plan.gracePeriodEnd)) {
    cancellationState = "grace";
  }

  const handleResubscribe = async () => {
    setResubscribing(true);
    try {
      const res = await fetch("/api/stripe/resubscribe", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        // If subscription fully ended, redirect to upgrade
        if (res.status === 400) {
          router.push("/upgrade");
          return;
        }
        toast.error(data.error ?? "Failed to resubscribe.");
        return;
      }

      toast.success("Welcome back! Your Pro plan has been reactivated.");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResubscribing(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to open billing portal.");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Banners */}
      {plan.status === "past_due" && (
        <PaymentFailedBanner
          onManageBilling={handleManageBilling}
          loading={portalLoading}
        />
      )}

      {cancellationState && (
        <CancellationBanner
          state={cancellationState}
          periodEndDate={plan.currentPeriodEnd}
          gracePeriodEndDate={plan.gracePeriodEnd}
          onResubscribe={handleResubscribe}
          resubscribing={resubscribing}
        />
      )}

      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Subscription card */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Plan
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <TierBadge plan={plan.plan} />
            {isPro && plan.currentPeriodEnd && !plan.cancelAtPeriodEnd && (
              <span className="text-xs text-gray-500">
                Renews {formatDate(plan.currentPeriodEnd)}
              </span>
            )}
          </div>
          {isPro && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
            >
              {portalLoading ? "Opening..." : "Manage Subscription"}
            </button>
          )}
          {!isPro && (
            <a
              href="/upgrade"
              className="mt-3 inline-block text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Upgrade to Pro
            </a>
          )}
        </div>

        {/* Usage card */}
        <UsageCard isPro={isPro} usageCount={usageCount} />

        {/* Tools card */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Tools
          </h3>
          <a
            href="/tools/nuget-advisor"
            className="mt-2 block text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            NuGet Advisor &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
