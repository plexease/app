"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Persona } from "@/lib/types/persona";
import { PERSONA_LABELS } from "@/lib/types/persona";

type Props = {
  viewingAs: Persona;
};

const PERSONAS: Persona[] = ["business_owner", "support_ops", "implementer"];
const SHORT_LABELS: Record<Persona, string> = {
  business_owner: "Business",
  support_ops: "Support",
  implementer: "Implementer",
};

export function ViewToggle({ viewingAs }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(viewingAs);
  const [loading, setLoading] = useState(false);

  const handleSwitch = async (persona: Persona) => {
    if (persona === current || loading) return;
    setLoading(true);
    try {
      await fetch("/api/view-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewingAs: persona }),
      });
      setCurrent(persona);
      router.refresh();
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 mb-2">
      <p className="px-3 text-xs text-muted-500 mb-1">View as</p>
      <div className="flex rounded-lg border border-surface-700 bg-surface-950 p-0.5">
        {PERSONAS.map((persona) => (
          <button
            key={persona}
            onClick={() => handleSwitch(persona)}
            disabled={loading}
            title={PERSONA_LABELS[persona]}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              current === persona
                ? "bg-surface-800 text-white"
                : "text-muted-400 hover:text-muted-300"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {SHORT_LABELS[persona]}
          </button>
        ))}
      </div>
    </div>
  );
}
