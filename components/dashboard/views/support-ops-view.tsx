"use client";

import Link from "next/link";
import { getToolsByCategory, TOOL_CATALOG, type ToolId } from "@/lib/tool-descriptions";

type Props = {
  recommendedToolIds: ToolId[];
};

export function SupportOpsView({ recommendedToolIds }: Props) {
  const categories = getToolsByCategory("support_ops");

  return (
    <div>
      {/* Recommended tools */}
      {recommendedToolIds.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-lg font-bold text-white">Recommended for you</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {recommendedToolIds.map((toolId) => {
              const tool = TOOL_CATALOG[toolId];
              if (!tool) return null;
              return (
                <Link
                  key={toolId}
                  href={tool.href}
                  className="min-w-[180px] flex-shrink-0 rounded-lg border border-surface-700 bg-surface-900 p-4 hover:border-brand-500/50 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <h3 className="text-sm font-semibold text-white">{tool.label}</h3>
                  <p className="mt-1 text-xs text-muted-400">{tool.descriptions.support_ops}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Category groups */}
      <h2 className="font-heading text-lg font-bold text-white">Tools</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {categories.map((category) => (
          <div
            key={category.label}
            className="rounded-lg border border-surface-700 bg-surface-900 p-5"
          >
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-400">
              {category.label}
            </h3>
            <p className="mt-1 text-xs text-muted-500">{category.description}</p>
            <div className="mt-3 space-y-1">
              {category.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="block rounded-lg px-2 py-2 text-sm text-muted-300 hover:bg-surface-800 hover:text-white transition-colors"
                >
                  <span className="font-medium">{tool.label}</span>
                  <span className="ml-2 text-xs text-muted-500">{tool.description}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
