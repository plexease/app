"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PricingToggle } from "@/components/billing/pricing-toggle";
import { PricingCard } from "@/components/billing/pricing-card";
import { FeatureComparison } from "@/components/billing/feature-comparison";
import { FaqSection } from "@/components/billing/faq-section";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

function UpgradePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  // Show toast if redirected from cancelled checkout
  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      toast("No worries — you can upgrade anytime.", { id: "checkout-cancelled" });
      router.replace("/upgrade", { scroll: false });
    }
  }, [searchParams, router]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyPro) {
          toast.error("You're already on Pro!");
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
      setLoading(false);
    }
  };

  const monthlyPrice = "\u00A319";
  const annualPrice = "\u00A3190";
  const annualMonthly = "\u00A315.83";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-bold text-white">Upgrade to Pro</h1>
      <p className="mt-2 text-muted-400">
        Unlock unlimited tool uses, saved history, and priority AI responses.
      </p>

      {/* Pricing toggle */}
      <div className="mt-8">
        <PricingToggle interval={interval} onChange={setInterval} />
      </div>

      {/* Pricing cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
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
          name="Pro"
          price={interval === "monthly" ? `${monthlyPrice}/mo` : `${annualPrice}/yr`}
          subtitle={interval === "annual" ? `${annualMonthly}/mo \u2014 save \u00A338` : undefined}
          features={[
            "Unlimited tool uses",
            "All available tools",
            "Saved history",
            "Priority AI responses",
          ]}
          cta={{
            label: loading ? "Redirecting..." : "Subscribe",
            onClick: handleSubscribe,
            disabled: loading,
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
