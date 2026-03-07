import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isProUser } from "@/lib/subscription";
import { Nav } from "@/components/landing/nav";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing-section";
import { Attribution } from "@/components/landing/attribution";
import { Footer } from "@/components/landing/footer";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isPro = user ? await isProUser(user.id) : false;

  return (
    <main id="main-content" className="min-h-screen bg-surface-950 text-white">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Plexease",
            description:
              "AI-powered integration tools for .NET developers, tech support staff, and small businesses.",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            offers: [
              {
                "@type": "Offer",
                price: "0",
                priceCurrency: "GBP",
                name: "Free",
              },
              {
                "@type": "Offer",
                price: "19",
                priceCurrency: "GBP",
                name: "Pro",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  billingDuration: "P1M",
                },
              },
            ],
          }),
        }}
      />

      {/* Nav */}
      <Nav />

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12)_0%,transparent_70%)]" />
        <div className="relative">
          <h1 className="font-heading text-5xl font-bold tracking-tight lg:text-6xl">
            Complex integrations,
            <br />
            <span
              className="animate-shimmer bg-[linear-gradient(110deg,#c4b5fd_35%,#e9d5ff_50%,#c4b5fd_65%)] bg-[length:200%_100%] bg-clip-text text-transparent motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-brand-300"
              style={{ WebkitBackgroundClip: "text" }}
            >
              with ease
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-400">
            AI-powered tools for .NET developers, tech support staff, and small businesses.
            Navigate package management, code generation, and e-commerce integrations
            without deep technical expertise.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium hover:bg-brand-600 shadow-glow transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
            >
              Start for free
            </Link>
            <Link
              href="#tools"
              className="rounded-lg border border-surface-700 px-6 py-3 text-sm font-medium text-muted-300 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
            >
              See tools
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Tools preview */}
      <section id="tools" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="font-heading text-center text-3xl font-bold">Tools</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-surface-700 bg-surface-900 p-6 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg">
            <h3 className="font-heading text-lg font-semibold">NuGet Package Advisor</h3>
            <p className="mt-2 text-sm text-muted-400">
              Enter a .NET package name and get instant analysis: what it does,
              alternatives, compatibility notes, and version advice.
            </p>
            <span className="mt-4 inline-block rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-400">
              Available now
            </span>
          </div>
          <div className="rounded-lg border border-surface-700 bg-surface-900 p-6 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg">
            <h3 className="font-heading text-lg font-semibold">More tools on the way</h3>
            <p className="mt-2 text-sm text-muted-400">
              Unit test generation, API wrapper generation, migration assistance,
              shipping integrations, and more.
            </p>
            <span className="mt-4 inline-block rounded-full bg-surface-700/50 px-3 py-1 text-xs text-muted-400">
              Planned
            </span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection isLoggedIn={!!user} isPro={isPro} />

      {/* Attribution */}
      <Attribution />

      {/* Footer */}
      <Footer />
    </main>
  );
}
