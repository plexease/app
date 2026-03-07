"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { TierBadge } from "@/components/billing/tier-badge";
import { UsageCounter } from "@/components/billing/usage-counter";
import { Logo } from "@/components/brand/logo";
import { resetCookieConsent } from "@/components/ui/cookie-consent";
import type { UserPlan } from "@/lib/subscription";

const navItems = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/tools/nuget-advisor", label: "NuGet Advisor" },
];

type Props = {
  plan: UserPlan;
  usageCount: number;
};

export function Sidebar({ plan, usageCount }: Props) {
  const pathname = usePathname();
  const isPro = plan.plan === "pro";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-surface-700 bg-surface-950 px-4 py-6">
      <Link href="/dashboard" aria-label="Plexease dashboard" className="inline-block rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950">
        <Logo iconSize={24} textSize={18} />
      </Link>

      {/* Tier badge + usage */}
      <div className="mt-4 flex items-center gap-2">
        <TierBadge plan={plan.plan} />
        {!isPro && (
          <Link
            href="/upgrade"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>
      <div className="mt-1">
        <UsageCounter isPro={isPro} usageCount={usageCount} />
      </div>

      <nav className="mt-6 flex-1 space-y-1">
        {navItems.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                isActive
                  ? "bg-surface-800 text-white"
                  : "text-muted-300 hover:bg-surface-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-700 pt-4 space-y-1">
        <button
          onClick={() => resetCookieConsent()}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-muted-400 hover:bg-surface-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          Manage cookies
        </button>
        <SignOutButton />
      </div>
    </aside>
  );
}
