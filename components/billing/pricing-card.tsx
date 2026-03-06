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
      className={`relative rounded-lg border p-6 ${
        highlighted ? "border-blue-600 bg-gray-900" : "border-gray-800 bg-gray-900"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <p className={`mt-2 text-3xl font-bold text-white transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}>
        {displayPrice}
      </p>
      {(subtitle || fading) && (
        <p className={`mt-1 text-sm text-gray-400 transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}>
          {subtitle ?? "\u00A0"}
        </p>
      )}
      <ul className="mt-6 space-y-3 text-sm text-gray-400">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      {cta.onClick ? (
        <button
          onClick={cta.onClick}
          disabled={cta.disabled}
          className={`mt-8 block w-full rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors disabled:opacity-50 ${
            highlighted
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "border border-gray-700 text-gray-300 hover:bg-gray-800"
          }`}
        >
          {cta.label}
        </button>
      ) : (
        <Link
          href={cta.href ?? "#"}
          className={`mt-8 block rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors ${
            highlighted
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "border border-gray-700 text-gray-300 hover:bg-gray-800"
          }`}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
