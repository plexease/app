"use client";

import { useState } from "react";
import { PricingToggle } from "@/components/billing/pricing-toggle";
import { PricingCard } from "@/components/billing/pricing-card";
import { FREE_MONTHLY_LIMIT, ESSENTIALS_MONTHLY_LIMIT, PRO_MONTHLY_LIMIT } from "@/lib/constants";

type Props = {
  isLoggedIn: boolean;
  plan: "free" | "essentials" | "pro";
};

export function PricingSection({ isLoggedIn, plan }: Props) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");

  const freeCta = isLoggedIn && plan === "free"
    ? { label: "Current plan", disabled: true }
    : isLoggedIn
      ? { label: "Current plan", disabled: true }
      : { label: "Get started", href: "/signup" };

  const essentialsCta = plan === "essentials"
    ? { label: "Your current plan", disabled: true }
    : isLoggedIn
      ? { label: "Upgrade to Essentials", href: "/upgrade" }
      : { label: "Get started", href: "/signup" };

  const proCta = plan === "pro"
    ? { label: "Your current plan", disabled: true }
    : isLoggedIn
      ? { label: "Upgrade to Pro", href: "/upgrade" }
      : { label: "Get started", href: "/signup" };

  return (
    <section id="pricing" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="font-heading text-center text-3xl font-bold">Pricing</h2>
      <div className="mt-8">
        <PricingToggle interval={interval} onChange={setInterval} />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
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
          name="Essentials"
          price={interval === "monthly" ? "\u00A35/mo" : "\u00A350/yr"}
          subtitle={interval === "annual" ? "\u00A34.17/mo \u2014 save \u00A310" : undefined}
          features={[
            `${ESSENTIALS_MONTHLY_LIMIT} tool uses per month`,
            "All available tools",
            "Saved history",
          ]}
          cta={essentialsCta}
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
          cta={proCta}
          highlighted
          badge={interval === "annual" ? "Best value" : undefined}
        />
      </div>
    </section>
  );
}
