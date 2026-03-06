"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { TierBadge } from "@/components/billing/tier-badge";
import { UsageCounter } from "@/components/billing/usage-counter";
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
    <aside className="flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-950 px-4 py-6">
      <Link href="/dashboard" className="text-xl font-bold text-white">
        Plexease
      </Link>

      {/* Tier badge + usage */}
      <div className="mt-4 flex items-center gap-2">
        <TierBadge plan={plan.plan} />
        {!isPro && (
          <Link
            href="/upgrade"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 pt-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
