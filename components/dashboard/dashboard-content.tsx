"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CancellationBanner } from "@/components/billing/cancellation-banner";
import { PaymentFailedBanner } from "@/components/billing/payment-failed-banner";
import { UsageCard } from "@/components/billing/usage-card";
import { TierBadge } from "@/components/billing/tier-badge";
import { BusinessOwnerView } from "./views/business-owner-view";
import { SupportOpsView } from "./views/support-ops-view";
import { ImplementerView } from "./views/implementer-view";
import { getRecommendedTools } from "@/lib/tool-recommendations";
import type { UserPlan } from "@/lib/subscription";
import type { Persona, PrimaryGoal, ComfortLevel } from "@/lib/types/persona";

type Props = {
  plan: UserPlan;
  usageCount: number;
  viewingAs: Persona;
  platforms: string[];
  primaryGoal: PrimaryGoal | null;
  comfortLevel: ComfortLevel | null;
};

export function DashboardContent({ plan, usageCount, viewingAs, platforms, primaryGoal, comfortLevel }: Props) {
  const router = useRouter();
  const [resubscribing, setResubscribing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPaid = plan.plan !== "free";

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
        if (res.status === 400) {
          router.push("/upgrade");
          return;
        }
        toast.error(data.error ?? "Failed to resubscribe.");
        return;
      }

      toast.success("Welcome back! Your plan has been reactivated.");
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

  const recommendedToolIds = getRecommendedTools(platforms, primaryGoal, comfortLevel);

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

      <h1 className="font-heading text-2xl font-bold text-white">Dashboard</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Subscription card */}
        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Plan
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <TierBadge plan={plan.plan} />
            {isPaid && plan.currentPeriodEnd && !plan.cancelAtPeriodEnd && (
              <span className="text-xs text-muted-500">
                Renews {formatDate(plan.currentPeriodEnd)}
              </span>
            )}
          </div>
          {isPaid && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="mt-3 text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg"
            >
              {portalLoading ? "Opening..." : "Manage Subscription"}
            </button>
          )}
          {!isPaid && (
            <a
              href="/upgrade"
              className="mt-3 inline-block text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Upgrade
            </a>
          )}
        </div>

        {/* Usage card */}
        <UsageCard plan={plan.plan} usageCount={usageCount} />
      </div>

      {/* Persona-specific content */}
      <div className="mt-8">
        {viewingAs === "business_owner" && (
          <BusinessOwnerView
            recommendedToolIds={recommendedToolIds}
            platforms={platforms}
          />
        )}
        {viewingAs === "support_ops" && (
          <SupportOpsView recommendedToolIds={recommendedToolIds} />
        )}
        {viewingAs === "implementer" && (
          <ImplementerView />
        )}
      </div>
    </div>
  );
}
