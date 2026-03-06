"use client";

import { useState } from "react";
import { PricingToggle } from "@/components/billing/pricing-toggle";
import { PricingCard } from "@/components/billing/pricing-card";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

type Props = {
  isLoggedIn: boolean;
  isPro: boolean;
};

export function PricingSection({ isLoggedIn, isPro }: Props) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");

  const proCta = isPro
    ? { label: "Your current plan", disabled: true }
    : isLoggedIn
      ? { label: "Upgrade to Pro", href: "/upgrade" }
      : { label: "Get started", href: "/signup" };

  const freeCta = isLoggedIn
    ? { label: "Current plan", disabled: true }
    : { label: "Get started", href: "/signup" };

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h2 className="text-center text-3xl font-bold">Pricing</h2>
      <div className="mt-8">
        <PricingToggle interval={interval} onChange={setInterval} />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <PricingCard
          name="Free"
          price={"\u00A30"}
          features={[
            `${FREE_MONTHLY_LIMIT} tool uses per month`,
            "All available tools",
          ]}
          cta={freeCta}
        />
        <PricingCard
          name="Pro"
          price={interval === "monthly" ? "\u00A319/mo" : "\u00A3190/yr"}
          subtitle={interval === "annual" ? "\u00A315.83/mo \u2014 save \u00A338" : undefined}
          features={[
            "Unlimited tool uses",
            "Saved history",
            "Priority AI responses",
          ]}
          cta={proCta}
          highlighted
          badge={interval === "annual" ? "Best value" : undefined}
        />
      </div>
    </section>
  );
}
