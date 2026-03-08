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

      <h1 className="font-heading text-2xl font-bold text-white">Dashboard</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Subscription card */}
        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Plan
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <TierBadge plan={plan.plan} />
            {isPro && plan.currentPeriodEnd && !plan.cancelAtPeriodEnd && (
              <span className="text-xs text-muted-500">
                Renews {formatDate(plan.currentPeriodEnd)}
              </span>
            )}
          </div>
          {isPro && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="mt-3 text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg"
            >
              {portalLoading ? "Opening..." : "Manage Subscription"}
            </button>
          )}
          {!isPro && (
            <a
              href="/upgrade"
              className="mt-3 inline-block text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Upgrade to Pro
            </a>
          )}
        </div>

        {/* Usage card */}
        <UsageCard isPro={isPro} usageCount={usageCount} />

      </div>

      {/* Workflow stages */}
      <div className="mt-8">
        <h2 className="font-heading text-lg font-bold text-white">Tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              stage: "Understand",
              description: "Explain code and errors in plain English",
              tools: [{ href: "/tools/code-explainer", label: "Code Explainer" }],
            },
            {
              stage: "Decide",
              description: "Plan integrations and choose packages",
              tools: [{ href: "/tools/integration-planner", label: "Integration Planner" }],
            },
            {
              stage: "Build",
              description: "Generate integration code and tests",
              tools: [{ href: "/tools/code-generator", label: "Code Generator" }],
            },
            {
              stage: "Maintain",
              description: "Audit dependencies and check health",
              tools: [{ href: "/tools/dependency-audit", label: "Dependency Audit" }],
            },
          ].map((stage) => (
            <div
              key={stage.stage}
              className="rounded-lg border border-surface-700 bg-surface-900 p-5"
            >
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-400">
                {stage.stage}
              </h3>
              <p className="mt-1 text-xs text-muted-500">{stage.description}</p>
              <div className="mt-3 space-y-1">
                {stage.tools.map((tool) => (
                  <a
                    key={tool.href}
                    href={tool.href}
                    className="block text-sm font-medium text-muted-300 hover:text-white transition-colors"
                  >
                    {tool.label} &rarr;
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
