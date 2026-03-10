"use client";

import Link from "next/link";
import { HeroInput } from "../hero-input";
import { TOOL_CATALOG, type ToolId } from "@/lib/tool-descriptions";

type Props = {
  recommendedToolIds: ToolId[];
  platforms: string[];
};

const STAGE_PROMPTS = [
  { label: "Something's broken", category: "troubleshoot" as const, href: "/tools/error-resolver" },
  { label: "Connect two services", category: "explore" as const, href: "/tools/integration-blueprint" },
  { label: "Help me choose tools", category: "explore" as const, href: "/tools/tool-finder" },
  { label: "Check my setup", category: "maintain" as const, href: "/tools/connection-health-check" },
];

export function BusinessOwnerView({ recommendedToolIds, platforms }: Props) {
  const hasRecommendations = recommendedToolIds.length > 0 && platforms.length > 0;

  return (
    <div>
      {/* Hero input */}
      <HeroInput />

      {/* Stage prompt buttons */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAGE_PROMPTS.map((prompt) => (
          <Link
            key={prompt.label}
            href={prompt.href}
            className="rounded-lg border border-surface-700 bg-surface-900 px-4 py-3 text-center text-sm font-medium text-muted-300 hover:border-brand-500/50 hover:bg-surface-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {prompt.label}
          </Link>
        ))}
      </div>

      {/* Recommended tools */}
      <div className="mt-8">
        <h2 className="font-heading text-lg font-bold text-white">
          {hasRecommendations ? "Recommended for you" : "Get started"}
        </h2>
        {!hasRecommendations && (
          <p className="mt-1 text-sm text-muted-500">
            Tell us about your platforms in{" "}
            <Link href="/settings" className="text-brand-400 hover:text-brand-300">
              Settings
            </Link>{" "}
            to get personalised recommendations.
          </p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(hasRecommendations ? recommendedToolIds : (Object.keys(TOOL_CATALOG).slice(0, 4) as ToolId[])).map((toolId) => {
            const tool = TOOL_CATALOG[toolId];
            if (!tool) return null;
            return (
              <Link
                key={toolId}
                href={tool.href}
                className="rounded-lg border border-surface-700 bg-surface-900 p-5 hover:border-brand-500/50 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <h3 className="font-heading text-sm font-semibold text-white">
                  {tool.label}
                </h3>
                <p className="mt-1 text-xs text-muted-400">
                  {tool.descriptions.business_owner}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
