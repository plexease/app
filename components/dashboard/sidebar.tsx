"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { TierBadge } from "@/components/billing/tier-badge";
import { UsageCounter } from "@/components/billing/usage-counter";
import { Logo } from "@/components/brand/logo";
import { resetCookieConsent } from "@/components/ui/cookie-consent";
import { ViewToggle } from "./view-toggle";
import type { UserPlan } from "@/lib/subscription";
import type { Persona } from "@/lib/types/persona";

const navGroups: { label: string | null; items: { href: string; label: string; exact?: boolean }[] }[] = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Dashboard", exact: true }],
  },
  {
    label: "Explore",
    items: [
      { href: "/tools/tool-finder", label: "Tool Finder" },
      { href: "/tools/integration-blueprint", label: "Integration Blueprint" },
    ],
  },
  {
    label: "Set Up",
    items: [
      { href: "/tools/code-generator", label: "Code Generator" },
      { href: "/tools/api-wrapper-generator", label: "API Wrapper Generator" },
    ],
  },
  {
    label: "Troubleshoot",
    items: [
      { href: "/tools/error-resolver", label: "Error Resolver" },
      { href: "/tools/how-it-works", label: "How It Works" },
    ],
  },
  {
    label: "Maintain",
    items: [
      { href: "/tools/compatibility-check", label: "Compatibility Check" },
      { href: "/tools/connection-health-check", label: "Connection Health Check" },
      { href: "/tools/upgrade-assistant", label: "Upgrade Assistant" },
      { href: "/tools/unit-test-generator", label: "Unit Test Generator" },
    ],
  },
];

type Props = {
  plan: UserPlan;
  usageCount: number;
  viewingAs: Persona;
};

export function Sidebar({ plan, usageCount, viewingAs }: Props) {
  const pathname = usePathname();
  const isFree = plan.plan === "free";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-surface-700 bg-surface-950 px-4 py-6">
      <Link href="/dashboard" aria-label="Plexease dashboard" className="inline-block rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950">
        <Logo iconSize={24} textSize={18} />
      </Link>

      {/* Tier badge + usage */}
      <div className="mt-4 flex items-center gap-2">
        <TierBadge plan={plan.plan} />
        {isFree && (
          <Link
            href="/upgrade"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>
      <div className="mt-1">
        <UsageCounter plan={plan.plan} usageCount={usageCount} />
      </div>

      <ViewToggle viewingAs={viewingAs} />

      <nav className="mt-6 flex-1 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label ?? "main"}>
            {group.label && (
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-500 mb-1">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map(({ href, label, exact }) => {
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
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-surface-700 pt-4 space-y-1">
        <Link
          href="/settings"
          className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            pathname === "/settings"
              ? "bg-surface-800 text-white font-medium"
              : "text-muted-400 hover:bg-surface-800 hover:text-white"
          }`}
        >
          Settings
        </Link>
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
