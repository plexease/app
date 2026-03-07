"use client";

type Props = {
  interval: "monthly" | "annual";
  onChange: (interval: "monthly" | "annual") => void;
};

export function PricingToggle({ interval, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`text-sm font-medium ${interval === "monthly" ? "text-white" : "text-muted-500"}`}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={interval === "annual"}
        onClick={() => onChange(interval === "monthly" ? "annual" : "monthly")}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            interval === "annual" ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium ${interval === "annual" ? "text-white" : "text-muted-500"}`}
      >
        Annual
      </span>
    </div>
  );
}
