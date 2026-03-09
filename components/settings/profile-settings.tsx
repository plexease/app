"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";
import { PERSONA_LABELS, PLATFORM_OPTIONS } from "@/lib/types/persona";

type ProfileData = {
  persona: Persona;
  comfortLevel: ComfortLevel | null;
  platforms: string[];
  primaryGoal: PrimaryGoal | null;
};

type Props = {
  initialProfile: ProfileData | null;
};

const COMFORT_LABELS: Record<ComfortLevel, string> = {
  guided: "Guide me step by step",
  docs_configs: "I can follow docs and configs",
  writes_code: "I write code",
};

const GOAL_LABELS: Record<PrimaryGoal, string> = {
  setup: "Setting up integrations",
  fixing: "Fixing a problem",
  evaluating: "Evaluating options",
  exploring: "Just exploring",
};

export function ProfileSettings({ initialProfile }: Props) {
  const [persona, setPersona] = useState<Persona>(initialProfile?.persona ?? "business_owner");
  const [comfortLevel, setComfortLevel] = useState<ComfortLevel | "">(initialProfile?.comfortLevel ?? "");
  const [platforms, setPlatforms] = useState<string[]>(initialProfile?.platforms ?? []);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | "">(initialProfile?.primaryGoal ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          comfortLevel: comfortLevel || undefined,
          platforms,
          primaryGoal: primaryGoal || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save.");
        return;
      }

      toast.success("Profile updated.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Persona */}
      <div>
        <label className="block text-sm font-medium text-muted-300 mb-2">Role</label>
        <div className="space-y-2">
          {(Object.entries(PERSONA_LABELS) as [Persona, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPersona(value)}
              className={`w-full p-3 rounded-lg border text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                persona === value
                  ? "border-brand-400 bg-brand-400/10 text-white"
                  : "border-surface-700 bg-surface-900 text-muted-300 hover:border-surface-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Comfort level */}
      <div>
        <label className="block text-sm font-medium text-muted-300 mb-2">Technical comfort</label>
        <select
          value={comfortLevel}
          onChange={(e) => setComfortLevel(e.target.value as ComfortLevel | "")}
          className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Not set</option>
          {(Object.entries(COMFORT_LABELS) as [ComfortLevel, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-muted-300 mb-2">Platforms</label>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORM_OPTIONS.map((plat) => {
            const selected = platforms.includes(plat.id);
            return (
              <button
                key={plat.id}
                onClick={() =>
                  setPlatforms((prev) =>
                    selected ? prev.filter((p) => p !== plat.id) : [...prev, plat.id]
                  )
                }
                className={`p-2.5 rounded-lg border text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  selected
                    ? "border-brand-400 bg-brand-400/10 text-white"
                    : "border-surface-700 bg-surface-900 text-muted-300 hover:border-surface-600"
                }`}
              >
                {plat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary goal */}
      <div>
        <label className="block text-sm font-medium text-muted-300 mb-2">Primary goal</label>
        <select
          value={primaryGoal}
          onChange={(e) => setPrimaryGoal(e.target.value as PrimaryGoal | "")}
          className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Not set</option>
          {(Object.entries(GOAL_LABELS) as [PrimaryGoal, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}
