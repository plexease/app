import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isProUser } from "@/lib/subscription";
import { PricingSection } from "@/components/landing/pricing-section";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isPro = user ? await isProUser(user.id) : false;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <span className="text-xl font-bold">Plexease</span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
        <h1 className="text-5xl font-bold tracking-tight lg:text-6xl">
          Complex integrations,
          <br />
          <span className="text-blue-400">made easy</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          AI-powered tools for .NET developers, tech support staff, and small businesses.
          Navigate package management, code generation, and e-commerce integrations
          without deep technical expertise.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Start for free
          </Link>
          <Link
            href="#tools"
            className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            See tools
          </Link>
        </div>
      </section>

      {/* Tools preview */}
      <section id="tools" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold">Tools</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold">NuGet Package Advisor</h3>
            <p className="mt-2 text-sm text-gray-400">
              Enter a .NET package name and get instant analysis: what it does,
              alternatives, compatibility notes, and version advice.
            </p>
            <span className="mt-4 inline-block rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-400">
              Available now
            </span>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <h3 className="text-lg font-semibold">More tools on the way</h3>
            <p className="mt-2 text-sm text-gray-400">
              Unit test generation, API wrapper generation, migration assistance,
              shipping integrations, and more.
            </p>
            <span className="mt-4 inline-block rounded-full bg-gray-700/50 px-3 py-1 text-xs text-gray-400">
              Planned
            </span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection isLoggedIn={!!user} isPro={isPro} />

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Plexease. All rights reserved.
      </footer>
    </main>
  );
}
