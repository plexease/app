"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  name: string;
  price: string;
  subtitle?: string;
  features: string[];
  cta: {
    label: string;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
  };
  highlighted?: boolean;
  badge?: string;
};

export function PricingCard({ name, price, subtitle, features, cta, highlighted, badge }: Props) {
  const [displayPrice, setDisplayPrice] = useState(price);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (price === displayPrice) return;
    setFading(true);
    const timeout = setTimeout(() => {
      setDisplayPrice(price);
      setFading(false);
    }, 150);
    return () => clearTimeout(timeout);
  }, [price, displayPrice]);

  return (
    <div
      className={`relative rounded-lg border p-6 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg ${
        highlighted ? "border-brand-500 bg-surface-900 shadow-glow-lg" : "border-surface-700 bg-surface-900"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-0.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
      <h3 className="font-heading text-lg font-semibold text-white">{name}</h3>
      <p className={`mt-2 font-heading text-3xl font-bold text-white transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}>
        {displayPrice}
      </p>
      {(subtitle || fading) && (
        <p className={`mt-1 text-sm text-muted-400 transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}>
          {subtitle ?? "\u00A0"}
        </p>
      )}
      <ul className="mt-6 space-y-3 text-sm text-muted-400">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      {cta.onClick ? (
        <button
          onClick={cta.onClick}
          disabled={cta.disabled}
          className={`mt-8 block w-full rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950 ${
            highlighted
              ? "bg-brand-500 text-white hover:bg-brand-600 shadow-glow"
              : "border border-surface-700 text-muted-300 hover:bg-surface-800"
          }`}
        >
          {cta.label}
        </button>
      ) : (
        <Link
          href={cta.href ?? "#"}
          className={`mt-8 block rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950 ${
            highlighted
              ? "bg-brand-500 text-white hover:bg-brand-600 shadow-glow"
              : "border border-surface-700 text-muted-300 hover:bg-surface-800"
          }`}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
