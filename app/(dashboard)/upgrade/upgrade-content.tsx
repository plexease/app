"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PricingToggle } from "@/components/billing/pricing-toggle";
import { PricingCard } from "@/components/billing/pricing-card";
import { FeatureComparison } from "@/components/billing/feature-comparison";
import { FaqSection } from "@/components/billing/faq-section";
import { FREE_MONTHLY_LIMIT, ESSENTIALS_MONTHLY_LIMIT, PRO_MONTHLY_LIMIT } from "@/lib/constants";

function UpgradePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<"essentials" | "pro" | null>(null);

  // Show toast if redirected from cancelled checkout
  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      toast("No worries — you can upgrade anytime.", { id: "checkout-cancelled" });
      router.replace("/upgrade", { scroll: false });
    }
  }, [searchParams, router]);

  const handleSubscribe = async (tier: "essentials" | "pro") => {
    setLoading(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval, tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadySubscribed) {
          toast.error("You're already subscribed to this plan!");
          router.push("/dashboard");
          return;
        }
        toast.error(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-heading text-2xl font-bold text-white">Upgrade</h1>
      <p className="mt-2 text-muted-400">
        Choose the plan that fits your needs.
      </p>

      {/* Pricing toggle */}
      <div className="mt-8">
        <PricingToggle interval={interval} onChange={setInterval} />
      </div>

      {/* Pricing cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <PricingCard
          name="Free"
          price={"\u00A30"}
          features={[
            `${FREE_MONTHLY_LIMIT} tool uses per month`,
            "All available tools",
          ]}
          cta={{ label: "Current plan", disabled: true }}
        />
        <PricingCard
          name="Essentials"
          price={interval === "monthly" ? "\u00A35/mo" : "\u00A350/yr"}
          subtitle={interval === "annual" ? "\u00A34.17/mo \u2014 save \u00A310" : undefined}
          features={[
            `${ESSENTIALS_MONTHLY_LIMIT} tool uses per month`,
            "All available tools",
            "Saved history",
          ]}
          cta={{
            label: loading === "essentials" ? "Redirecting..." : "Subscribe",
            onClick: () => handleSubscribe("essentials"),
            disabled: loading !== null,
          }}
          badge={interval === "annual" ? "Save 17%" : undefined}
        />
        <PricingCard
          name="Pro"
          price={interval === "monthly" ? "\u00A319/mo" : "\u00A3190/yr"}
          subtitle={interval === "annual" ? "\u00A315.83/mo \u2014 save \u00A338" : undefined}
          features={[
            `${PRO_MONTHLY_LIMIT} tool uses per month`,
            "All available tools",
            "Saved history",
            "Priority AI responses",
          ]}
          cta={{
            label: loading === "pro" ? "Redirecting..." : "Subscribe",
            onClick: () => handleSubscribe("pro"),
            disabled: loading !== null,
          }}
          highlighted
          badge={interval === "annual" ? "Best value" : undefined}
        />
      </div>

      {/* Trust signal */}
      <p className="mt-6 text-center text-xs text-muted-500">
        Powered by Stripe &mdash; secure payments. We never see your card details.
      </p>

      {/* Feature comparison */}
      <div className="mt-12">
        <FeatureComparison />
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection />
      </div>
    </div>
  );
}

export function UpgradeContent() {
  return (
    <Suspense>
      <UpgradePageContent />
    </Suspense>
  );
}
