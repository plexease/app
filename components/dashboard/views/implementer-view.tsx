"use client";

import Link from "next/link";
import { getAllTools } from "@/lib/tool-descriptions";

export function ImplementerView() {
  const tools = getAllTools("implementer");

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-white">All Tools</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="rounded-lg border border-surface-700 bg-surface-900 p-4 hover:border-brand-500/50 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-white">{tool.label}</h3>
              <span className="ml-2 rounded bg-surface-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-500">
                {tool.category}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-400">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
