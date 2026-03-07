# Phase 6 — Marketing & Trust Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add landing page sections (How It Works, Attribution, enhanced footer), legal pages (ToS + Privacy), SEO fundamentals (meta tags, sitemap, robots, JSON-LD), and an apple touch icon.

**Architecture:** Static server components for legal pages. Shared nav/footer extracted from the landing page into reusable components. SEO via Next.js Metadata API (`sitemap.ts`, `robots.ts`, enhanced `layout.tsx` metadata). No new dependencies.

**Tech Stack:** Next.js (TypeScript), Tailwind CSS v4, existing brand tokens from `app/globals.css`

**Reference:** Design doc at `docs/plans/2026-03-07-phase6-marketing-trust-design.md`, brand guide at `docs/brand-style-guide.md`

---

### Task 1: Extract Nav component

**Files:**
- Create: `components/landing/nav.tsx`
- Modify: `app/page.tsx:1-35`

**Step 1: Create the Nav component**

Extract the nav from `app/page.tsx:17-35` into a shared component. It's a server component (no "use client" needed — `Link` works in server components).

```tsx
// components/landing/nav.tsx
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function Nav() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 lg:px-12">
      <Link href="/" aria-label="Plexease home" className="hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950 rounded-lg">
        <Logo iconSize={28} textSize={22} />
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm text-muted-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950 rounded-lg px-2 py-1"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium hover:bg-brand-600 shadow-glow transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
```

**Step 2: Update page.tsx to use Nav**

Replace the inline `<nav>...</nav>` block (lines 17-35) with `<Nav />`. Add the import:

```tsx
import { Nav } from "@/components/landing/nav";
```

Remove the now-unused `Logo` import from page.tsx (it's only used in the nav).

**Step 3: Verify the dev server compiles**

Run: `cd /home/deck/Projects/plexease && npm run build 2>&1 | tail -20`
Expected: Build succeeds, no errors.

**Step 4: Commit**

```bash
git add components/landing/nav.tsx app/page.tsx
git commit -m "refactor: extract landing nav into shared component"
```

---

### Task 2: Extract and enhance Footer component

**Files:**
- Create: `components/landing/footer.tsx`
- Modify: `app/page.tsx:103-112`

**Step 1: Create the enhanced Footer component**

The footer needs `ManageCookiesButton` which is a client component, but the footer itself can be a server component that composes it.

```tsx
// components/landing/footer.tsx
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ManageCookiesButton } from "@/components/ui/manage-cookies-button";

export function Footer() {
  return (
    <footer className="border-t border-surface-700 px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-4xl grid gap-8 md:grid-cols-3">
        {/* Brand */}
        <div>
          <Logo iconSize={24} textSize={18} />
          <p className="mt-3 text-sm text-muted-500">
            Complex integrations, with ease
          </p>
          <p className="mt-4 text-xs text-muted-500">
            &copy; {new Date().getFullYear()} Plexease. All rights reserved.
          </p>
        </div>

        {/* Product */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-muted-300">Product</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/#tools" className="text-muted-500 hover:text-muted-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-1 py-0.5">
                Tools
              </Link>
            </li>
            <li>
              <Link href="/#pricing" className="text-muted-500 hover:text-muted-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-1 py-0.5">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-heading text-sm font-semibold text-muted-300">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/terms" className="text-muted-500 hover:text-muted-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-1 py-0.5">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-muted-500 hover:text-muted-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-1 py-0.5">
                Privacy Policy
              </Link>
            </li>
            <li>
              <ManageCookiesButton />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Update page.tsx to use Footer**

Replace the inline `<footer>...</footer>` block (lines 103-112) with `<Footer />`. Add the import:

```tsx
import { Footer } from "@/components/landing/footer";
```

Remove the now-unused `ManageCookiesButton` import from page.tsx.

**Step 3: Verify the dev server compiles**

Run: `cd /home/deck/Projects/plexease && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/landing/footer.tsx app/page.tsx
git commit -m "refactor: extract and enhance landing footer with multi-column layout"
```

---

### Task 3: Create HowItWorks component

**Files:**
- Create: `components/landing/how-it-works.tsx`
- Modify: `app/page.tsx` (add between Hero and Tools sections)

**Step 1: Create the component**

```tsx
// components/landing/how-it-works.tsx
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
          <div key={step.number} className="relative flex flex-col items-center text-center">
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
```

**Step 2: Add HowItWorks to page.tsx**

Insert between the Hero section and the Tools section. Add the import:

```tsx
import { HowItWorks } from "@/components/landing/how-it-works";
```

In the JSX, after the closing `</section>` of the Hero (after line 71 in the original) and before the `{/* Tools preview */}` comment:

```tsx
      {/* How it works */}
      <HowItWorks />
```

**Step 3: Verify the dev server compiles**

Run: `cd /home/deck/Projects/plexease && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/landing/how-it-works.tsx app/page.tsx
git commit -m "feat: add How It Works section to landing page"
```

---

### Task 4: Create Attribution component and add pricing anchor

**Files:**
- Create: `components/landing/attribution.tsx`
- Modify: `app/page.tsx` (add between Pricing and Footer)
- Modify: `components/landing/pricing-section.tsx:27`

**Step 1: Create the Attribution component**

```tsx
// components/landing/attribution.tsx
export function Attribution() {
  return (
    <section className="px-6 py-8 text-center">
      <p className="text-sm text-muted-500">
        Powered by Claude AI from{" "}
        <a
          href="https://www.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-400 hover:text-muted-300 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg"
        >
          Anthropic
        </a>
      </p>
    </section>
  );
}
```

**Step 2: Add Attribution to page.tsx**

Insert between PricingSection and Footer. Add the import:

```tsx
import { Attribution } from "@/components/landing/attribution";
```

In the JSX, after `<PricingSection ... />` and before `<Footer />`:

```tsx
      {/* Attribution */}
      <Attribution />
```

**Step 3: Add id="pricing" to PricingSection**

In `components/landing/pricing-section.tsx`, change line 27 from:

```tsx
    <section className="mx-auto max-w-4xl px-6 py-16">
```

to:

```tsx
    <section id="pricing" className="mx-auto max-w-4xl px-6 py-16">
```

**Step 4: Verify the dev server compiles**

Run: `cd /home/deck/Projects/plexease && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add components/landing/attribution.tsx app/page.tsx components/landing/pricing-section.tsx
git commit -m "feat: add Attribution strip and pricing anchor to landing page"
```

---

### Task 5: Enhanced metadata in layout.tsx

**Files:**
- Modify: `app/layout.tsx:23-30`

**Step 1: Update the metadata export**

Replace the existing `metadata` export (lines 23-30) with:

```tsx
export const metadata: Metadata = {
  title: { default: "Plexease", template: "%s | Plexease" },
  description:
    "AI-powered integration tools for .NET developers, tech support staff, and small businesses.",
  keywords: [
    "NuGet",
    ".NET",
    "integration tools",
    "AI",
    "package advisor",
    "code generation",
  ],
  // TODO: Replace with https://plexease.io when domain is purchased
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "Plexease",
    description: "Complex integrations, with ease",
    siteName: "Plexease",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plexease",
    description: "Complex integrations, with ease",
  },
  robots: { index: true, follow: true },
};
```

Note: `metadataBase` uses `NEXT_PUBLIC_SITE_URL` env var so it works in dev (localhost) and prod (Vercel). Vercel auto-sets `VERCEL_URL` but we use a custom env var for clarity.

**Step 2: Verify the dev server compiles**

Run: `cd /home/deck/Projects/plexease && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: enhance metadata with OG, Twitter card, keywords, and SEO config"
```

---

### Task 6: Create sitemap.ts and robots.ts

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

**Step 1: Create sitemap.ts**

```tsx
// app/sitemap.ts
import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
```

**Step 2: Create robots.ts**

```tsx
// app/robots.ts
import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

**Step 3: Verify the dev server compiles**

Run: `cd /home/deck/Projects/plexease && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: add sitemap.xml and robots.txt generation"
```

---

### Task 7: Add JSON-LD structured data to landing page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add JSON-LD script to page.tsx**

Add at the top of the `<main>` element, before `<Nav />`:

```tsx
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
```

**Step 2: Verify the dev server compiles**

Run: `cd /home/deck/Projects/plexease && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add JSON-LD structured data to landing page"
```

---

### Task 8: Create Terms of Service page

**Files:**
- Create: `app/terms/page.tsx`

**Step 1: Create the Terms of Service page**

This is a server component. It imports Nav and Footer. The legal copy is generated as a best-effort draft for UK sole trader using Supabase/Stripe/Claude.

```tsx
// app/terms/page.tsx
import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

export default function TermsOfService() {
  return (
    <main id="main-content" className="min-h-screen bg-surface-950 text-white">
      <Nav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-heading text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-500">Last updated: 7 March 2026</p>

        <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-300">
          <h2 className="font-heading text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Plexease (&quot;the Service&quot;), you agree to be bound by these
            Terms of Service (&quot;Terms&quot;). If you do not agree, you must not use the Service.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">2. Description of Service</h2>
          <p>
            Plexease provides AI-powered integration tools designed for .NET developers,
            tech support staff, and small businesses. The Service includes tools such as the
            NuGet Package Advisor, with additional tools added over time. All AI-generated
            outputs are produced using third-party large language models.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">3. Account Registration</h2>
          <p>
            To access certain features, you must create an account by providing a valid email
            address and password. You are responsible for maintaining the confidentiality of
            your account credentials and for all activity that occurs under your account.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">4. Free and Pro Plans</h2>
          <p>
            The Service offers a Free plan (20 tool uses per month) and a Pro plan
            (&pound;19/month or &pound;190/year) with unlimited tool uses, saved history, and
            priority AI responses. We reserve the right to modify plan features and pricing
            with 30 days&apos; notice.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">5. Payment Terms</h2>
          <p>
            Pro subscriptions are billed in GBP via Stripe. Payments are non-refundable except
            where required by law. You may cancel your subscription at any time through the
            billing portal; access continues until the end of the current billing period. We do
            not store your payment card details — all payment processing is handled by Stripe.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, scrape, or extract data from the Service</li>
            <li>Abuse AI tools by submitting harmful, misleading, or excessively repetitive queries</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Share your account credentials with third parties</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">7. Intellectual Property</h2>
          <p>
            You retain ownership of any inputs you provide to the Service. AI-generated outputs
            are provided for your use but come with no guarantee of originality or accuracy.
            The Plexease platform, brand, and code are the intellectual property of the Service
            operator.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">8. AI Disclaimer</h2>
          <p>
            AI-generated outputs are for informational purposes only and do not constitute
            professional, legal, financial, or technical advice. You should independently verify
            any information or recommendations before relying on them. We make no warranties
            regarding the accuracy, completeness, or suitability of AI outputs.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Plexease and its operator shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages
            arising from your use of the Service. Our total liability shall not exceed the
            amount you paid for the Service in the 12 months preceding the claim.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">10. Termination</h2>
          <p>
            We may suspend or terminate your account if you breach these Terms. You may delete
            your account at any time by contacting us. Upon termination, your right to use the
            Service ceases immediately, though provisions that by their nature should survive
            (such as limitation of liability) will remain in effect.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">11. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of England
            and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts
            of England and Wales.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">12. Contact</h2>
          <p>
            If you have questions about these Terms, please contact us at{" "}
            <a href="mailto:hello@plexease.io" className="text-brand-400 hover:text-brand-300 transition-colors">
              hello@plexease.io
            </a>.
          </p>
        </section>
      </article>
      <Footer />
    </main>
  );
}
```

**Step 2: Verify the dev server compiles**

Run: `cd /home/deck/Projects/plexease && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/terms/page.tsx
git commit -m "feat: add Terms of Service page"
```

---

### Task 9: Create Privacy Policy page

**Files:**
- Create: `app/privacy/page.tsx`

**Step 1: Create the Privacy Policy page**

```tsx
// app/privacy/page.tsx
import type { Metadata } from "next";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicy() {
  return (
    <main id="main-content" className="min-h-screen bg-surface-950 text-white">
      <Nav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-heading text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-500">Last updated: 7 March 2026</p>

        <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-300">
          <h2 className="font-heading text-xl font-semibold text-white">1. Data Controller</h2>
          <p>
            Plexease is operated by a sole trader registered in the United Kingdom. For the
            purposes of the UK General Data Protection Regulation (UK GDPR) and the Data
            Protection Act 2018, the data controller is the operator of Plexease.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">2. Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li><strong className="text-white">Account data:</strong> email address and hashed password (managed by Supabase Auth)</li>
            <li><strong className="text-white">Usage data:</strong> which tools you use and how many times per month</li>
            <li><strong className="text-white">Payment data:</strong> billing information processed by Stripe (we do not store card numbers)</li>
            <li><strong className="text-white">Technical data:</strong> IP address, browser type, and device information collected automatically</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">3. How We Use Your Data</h2>
          <p>We use your personal data to:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Provide and maintain your account and access to the Service</li>
            <li>Process payments and manage your subscription</li>
            <li>Process your inputs through AI tools and return results</li>
            <li>Enforce usage limits and monitor for abuse</li>
            <li>Communicate service updates or changes</li>
          </ul>
          <p>
            We do not sell your personal data. We do not use your tool inputs for training
            AI models.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">4. Third-Party Processors</h2>
          <p>We share data with the following processors, each under appropriate safeguards:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li><strong className="text-white">Supabase</strong> (auth and database hosting) — USA</li>
            <li><strong className="text-white">Stripe</strong> (payment processing) — USA</li>
            <li><strong className="text-white">Anthropic</strong> (AI model provider, Claude API) — USA</li>
            <li><strong className="text-white">Vercel</strong> (application hosting and deployment) — USA</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">5. Cookies</h2>
          <p>
            We use cookies to manage your authentication session and remember your cookie
            consent preference. We do not use third-party tracking or advertising cookies.
            You can manage your cookie preferences at any time using the &quot;Manage cookies&quot;
            option in the footer.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">6. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. Usage data is
            retained for 12 months for billing and analytics purposes. Payment records are
            retained as required by UK tax law (typically 6 years). If you delete your account,
            we will remove your personal data within 30 days, except where retention is required
            by law.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">7. Your Rights</h2>
          <p>Under the UK GDPR, you have the right to:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li><strong className="text-white">Access</strong> your personal data</li>
            <li><strong className="text-white">Rectify</strong> inaccurate personal data</li>
            <li><strong className="text-white">Erase</strong> your personal data (&quot;right to be forgotten&quot;)</li>
            <li><strong className="text-white">Port</strong> your data to another service</li>
            <li><strong className="text-white">Object</strong> to processing of your personal data</li>
            <li><strong className="text-white">Restrict</strong> processing in certain circumstances</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at the email address below. We will
            respond within 30 days. You also have the right to lodge a complaint with the
            Information Commissioner&apos;s Office (ICO) at{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 transition-colors">
              ico.org.uk
            </a>.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">8. International Transfers</h2>
          <p>
            Our third-party processors (Supabase, Stripe, Anthropic, Vercel) are based in the
            United States. Data transfers to the US are protected under appropriate safeguards
            including Standard Contractual Clauses and the EU-US Data Privacy Framework where
            applicable.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">9. Children&apos;s Privacy</h2>
          <p>
            The Service is not designed for or directed at individuals under the age of 16. We
            do not knowingly collect personal data from children. If we become aware that we
            have collected data from a child under 16, we will delete it promptly.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify registered
            users of material changes via email. The &quot;Last updated&quot; date at the top of this
            page indicates when the policy was last revised.
          </p>

          <h2 className="font-heading text-xl font-semibold text-white mt-10">11. Contact</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your data
            rights, please contact us at{" "}
            <a href="mailto:hello@plexease.io" className="text-brand-400 hover:text-brand-300 transition-colors">
              hello@plexease.io
            </a>.
          </p>
        </section>
      </article>
      <Footer />
    </main>
  );
}
```

**Step 2: Verify the dev server compiles**

Run: `cd /home/deck/Projects/plexease && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/privacy/page.tsx
git commit -m "feat: add Privacy Policy page"
```

---

### Task 10: Generate Apple touch icon

**Files:**
- Create: `public/apple-touch-icon.png`

**Step 1: Generate the PNG from SVG**

Use the existing `app/icon.svg` to create a 180x180 PNG. The SVG viewBox is 48x48 with a transparent background. For the touch icon, add the `surface-950` background so it looks good on iOS.

Run:

```bash
cd /home/deck/Projects/plexease
# Create a padded SVG with background for the touch icon
cat > /tmp/apple-touch-icon.svg << 'SVGEOF'
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="36" fill="#0c0a14"/>
  <g transform="translate(42, 42) scale(2)">
    <line x1="12" y1="14" x2="30" y2="10" stroke="#2e2946" stroke-width="2.5"/>
    <line x1="30" y1="10" x2="38" y2="28" stroke="#2e2946" stroke-width="2.5"/>
    <line x1="38" y1="28" x2="18" y2="36" stroke="#2e2946" stroke-width="2.5"/>
    <line x1="18" y1="36" x2="12" y2="14" stroke="#2e2946" stroke-width="2.5"/>
    <circle cx="12" cy="14" r="5" fill="#8b5cf6"/>
    <circle cx="30" cy="10" r="5" fill="#c4b5fd"/>
    <circle cx="38" cy="28" r="5" fill="#a78bfa"/>
    <circle cx="18" cy="36" r="5" fill="#7c3aed"/>
  </g>
</svg>
SVGEOF

# Convert to PNG (requires rsvg-convert or similar — check what's available)
# Option A: rsvg-convert
rsvg-convert -w 180 -h 180 /tmp/apple-touch-icon.svg -o public/apple-touch-icon.png

# Option B: If rsvg-convert is not available, use ImageMagick convert
# convert -background none -resize 180x180 /tmp/apple-touch-icon.svg public/apple-touch-icon.png

# Option C: If neither is available, use sharp via a Node one-liner
# node -e "const sharp = require('sharp'); sharp('/tmp/apple-touch-icon.svg').resize(180,180).png().toFile('public/apple-touch-icon.png')"
```

Try Option A first; if `rsvg-convert` isn't installed, try Option B (`convert`), then Option C (install sharp temporarily with `npx`).

**Step 2: Verify the file exists and has reasonable size**

Run: `ls -la public/apple-touch-icon.png`
Expected: File exists, roughly 2-10 KB.

**Step 3: Commit**

```bash
git add public/apple-touch-icon.png
git commit -m "feat: add apple touch icon for iOS bookmarks"
```

---

### Task 11: Run Playwright tests

**Files:** None modified — verification only.

**Step 1: Run the full Playwright suite**

```bash
cd /home/deck/Projects/plexease/playwright
./setup-env.sh
npm test
```

Expected: 18/18 tests pass. No regressions from landing page changes (tests target auth, dashboard, and tools — not the landing page content).

**Step 2: Manual smoke test**

Start the dev server and manually verify:

```bash
cd /home/deck/Projects/plexease && npm run dev
```

Check in browser:
- `/` — Nav, Hero, How It Works, Tools, Pricing, Attribution, Footer all render
- Footer links to `/terms` and `/privacy` work
- `/terms` — full Terms of Service page renders with nav and footer
- `/privacy` — full Privacy Policy page renders with nav and footer
- `/sitemap.xml` — returns valid XML with 5 URLs
- `/robots.txt` — returns correct allow/disallow rules
- View page source on `/` — JSON-LD script tag present
- View page source on `/` — OG and Twitter meta tags in `<head>`

**Step 3: No commit needed — this is verification only**

---

### Task 12: Update PLEXEASE.md

**Files:**
- Modify: `PLEXEASE.md` (Current Status section and Phase 6 checklist)

**Step 1: Update Phase 6 checklist**

Mark all Phase 6 items as complete:

```markdown
### ✅ Phase 6 — Marketing & Trust (complete)
- [x] Landing page refresh (How It Works, Attribution strip, enhanced footer)
- [x] Legal pages (Terms of Service, Privacy Policy)
- [x] Trust signals ("Powered by Claude AI" attribution)
- [x] SEO fundamentals (meta tags, JSON-LD, sitemap.xml, robots.txt)
- [x] Social card metadata (OG + Twitter cards)
- [x] Apple touch icon
```

**Step 2: Update Current Status section**

```markdown
## Current Status

- Phase: 6 complete, merged to main
- Last action: Phase 6 marketing & trust — landing page refresh (How It Works, Attribution, enhanced footer), legal pages (ToS + Privacy), SEO (meta tags, JSON-LD, sitemap, robots), social cards, apple touch icon.
- Next step: Phase 7 — Testing & Environments
- Test setup: run `cd playwright && ./setup-env.sh` to generate `.env.test` from `.env.local`, then `npm test` for full Playwright suite
- Brand guide: `docs/brand-style-guide.md` — reference for all future UI work
```

**Step 3: Commit**

```bash
git add PLEXEASE.md
git commit -m "docs: update PLEXEASE.md — Phase 6 complete"
```
