const steps = [
  {
    number: 1,
    heading: "Pick a tool",
    description: "Choose from our growing suite of integration tools",
  },
  {
    number: 2,
    heading: "Describe your problem",
    description: "Enter your package, API, or integration question",
  },
  {
    number: 3,
    heading: "Get AI-powered answers",
    description: "Receive detailed analysis, alternatives, and actionable advice",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h2 className="font-heading text-center text-3xl font-bold">How it works</h2>
      <div className="relative mt-12 grid gap-6 md:grid-cols-3">
        {/* Connector line — desktop only */}
        <div className="absolute top-8 left-[16.67%] right-[16.67%] hidden h-px border-t border-dashed border-surface-700 md:block" aria-hidden="true" />

        {steps.map((step) => (
          <div key={step.number} className="relative flex flex-col items-center text-center rounded-xl bg-surface-900 border border-surface-700 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
              {step.number}
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold">{step.heading}</h3>
            <p className="mt-2 text-sm text-muted-400">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
