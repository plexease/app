"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";
import { PERSONA_LABELS, PLATFORM_OPTIONS } from "@/lib/types/persona";

type Step = 1 | 2 | 3 | 4;

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [comfortLevel, setComfortLevel] = useState<ComfortLevel | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [otherPlatform, setOtherPlatform] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile(skipFields?: boolean) {
    setSaving(true);
    setError(null);

    const allPlatforms = otherPlatform.trim()
      ? [...platforms, otherPlatform.trim()]
      : platforms;

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          comfortLevel: skipFields ? undefined : comfortLevel,
          platforms: skipFields ? undefined : allPlatforms,
          primaryGoal: skipFields ? undefined : primaryGoal,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        setSaving(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  // Step 1: Role selection
  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white font-heading">
            Welcome to Plexease
          </h1>
          <p className="text-muted-400">
            We&apos;ll ask a few questions to tailor your experience.
            You can change these anytime in settings.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-300">
            What best describes your role?
          </p>
          {(Object.entries(PERSONA_LABELS) as [Persona, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setPersona(value);
                  setStep(2);
                }}
                className="w-full p-4 rounded-lg border border-surface-700 bg-surface-900
                  text-white text-left hover:border-brand-400 hover:bg-surface-800
                  transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {label}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => {
            if (!persona) setPersona("business_owner");
            saveProfile(true);
          }}
          disabled={saving}
          className="w-full text-sm text-muted-500 hover:text-muted-300 transition-colors"
        >
          I know what I&apos;m doing — skip setup
        </button>
      </div>
    );
  }

  // Step 2: Comfort level
  if (step === 2) {
    const options: { value: ComfortLevel; label: string }[] = [
      { value: "guided", label: "Guide me step by step" },
      { value: "docs_configs", label: "I can follow docs and configs" },
      { value: "writes_code", label: "I write code" },
    ];

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white font-heading">
            Technical comfort
          </h1>
          <p className="text-muted-400">
            How comfortable are you with technical concepts?
          </p>
        </div>

        <div className="space-y-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setComfortLevel(opt.value);
                setStep(3);
              }}
              disabled={saving}
              className="w-full p-4 rounded-lg border border-surface-700 bg-surface-900
                text-white text-left hover:border-brand-400 hover:bg-surface-800
                transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep(1)}
          className="w-full text-sm text-muted-500 hover:text-muted-300"
        >
          Back
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    );
  }

  // Step 3: Platforms
  if (step === 3) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white font-heading">
            Your platforms
          </h1>
          <p className="text-muted-400">
            What platforms do you use? Select all that apply.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PLATFORM_OPTIONS.map((plat) => {
            const selected = platforms.includes(plat.id);
            return (
              <button
                key={plat.id}
                onClick={() =>
                  setPlatforms((prev) =>
                    selected
                      ? prev.filter((p) => p !== plat.id)
                      : [...prev, plat.id]
                  )
                }
                className={`p-3 rounded-lg border text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
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

        <input
          type="text"
          placeholder="Other (type platform name)"
          value={otherPlatform}
          onChange={(e) => setOtherPlatform(e.target.value)}
          className="w-full p-3 rounded-lg border border-surface-700 bg-surface-900
            text-white placeholder-muted-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setStep(2)}
            className="flex-1 p-3 rounded-lg border border-surface-700 text-muted-300
              hover:text-white transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            Back
          </button>
          <button
            onClick={() => setStep(4)}
            className="flex-1 p-3 rounded-lg bg-brand-500 text-white font-medium
              hover:bg-brand-400 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Primary goal
  if (step === 4) {
    const goals: { value: PrimaryGoal; label: string }[] = [
      { value: "setup", label: "Setting up integrations" },
      { value: "fixing", label: "Fixing a problem" },
      { value: "evaluating", label: "Evaluating options" },
      { value: "exploring", label: "Just exploring" },
    ];

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white font-heading">
            What brings you here?
          </h1>
          <p className="text-muted-400">
            This helps us show you the most relevant tools first.
          </p>
        </div>

        <div className="space-y-3">
          {goals.map((goal) => (
            <button
              key={goal.value}
              onClick={() => {
                setPrimaryGoal(goal.value);
                saveProfile(false);
              }}
              disabled={saving}
              className="w-full p-4 rounded-lg border border-surface-700 bg-surface-900
                text-white text-left hover:border-brand-400 hover:bg-surface-800
                transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {goal.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep(3)}
          className="w-full text-sm text-muted-500 hover:text-muted-300"
        >
          Back
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    );
  }

  return null;
}
