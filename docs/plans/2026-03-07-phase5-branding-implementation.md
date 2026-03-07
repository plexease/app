# Phase 5 — Branding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the complete Plexease brand identity — purple colour system, Plus Jakarta Sans + Inter typography, organic cluster logo, visual polish, and accessibility improvements — across every page and component.

**Architecture:** Register brand tokens via Tailwind v4 `@theme` in `globals.css`, load fonts via `next/font/google` in `layout.tsx`, create reusable logo components in `components/brand/`, then systematically migrate all 26+ files from blue/gray to brand/surface/muted tokens. Final pass adds visual polish and accessibility features.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4 (`@theme`), `next/font/google` (Plus Jakarta Sans, Inter), inline SVG React components, Sonner toast library.

**Design doc:** `docs/plans/2026-03-07-phase5-branding-design.md`

---

## Task 1: Theme Tokens — globals.css

**Files:**
- Modify: `app/globals.css`

**Step 1: Replace globals.css with theme tokens**

```css
@import "tailwindcss";

@theme {
  /* Brand */
  --color-brand-50: #faf5ff;
  --color-brand-100: #f3e8ff;
  --color-brand-300: #c4b5fd;
  --color-brand-400: #a78bfa;
  --color-brand-500: #8b5cf6;
  --color-brand-600: #7c3aed;
  --color-brand-700: #6d28d9;

  /* Surfaces */
  --color-surface-950: #0c0a14;
  --color-surface-900: #131121;
  --color-surface-800: #1e1a2e;
  --color-surface-700: #2e2946;

  /* Muted text */
  --color-muted-300: #b8b4cc;
  --color-muted-400: #9490ad;
  --color-muted-500: #6e6890;

  /* Fonts */
  --font-sans: var(--font-body), system-ui, sans-serif;
  --font-heading: var(--font-heading), system-ui, sans-serif;

  /* Shadows */
  --shadow-glow: 0 0 16px rgba(139, 92, 246, 0.25);
  --shadow-glow-lg: 0 0 24px rgba(139, 92, 246, 0.15);
}

/* Tagline shimmer animation */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* Reduced motion: disable animations */
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer {
    animation: none !important;
    background: none !important;
    -webkit-text-fill-color: var(--color-brand-300) !important;
  }
  .motion-safe-hover {
    transform: none !important;
  }
}
```

**Step 2: Verify tokens work**

Run: `cd /home/deck/Projects/plexease && npm run dev`

Open browser, inspect `<html>` element — CSS custom properties `--color-brand-500`, `--color-surface-950`, etc. should be visible in computed styles.

Expected: Custom properties registered, no build errors.

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(brand): add Tailwind v4 @theme tokens for brand colours, surfaces, muted text, fonts, and shadows"
```

---

## Task 2: Font Loading — layout.tsx

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Update layout.tsx with fonts, metadata, skip-to-content, and Sonner theming**

Replace the full file with:

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/ui/cookie-consent";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
  adjustFontFallback: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Plexease",
  description: "Complex integrations, with ease",
  openGraph: {
    title: "Plexease",
    description: "Complex integrations, with ease",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${inter.variable} font-sans`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <CookieConsent />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#131121",
              border: "1px solid #2e2946",
              color: "#b8b4cc",
            },
            actionButtonStyle: {
              background: "#8b5cf6",
              color: "#ffffff",
            },
          }}
        />
      </body>
    </html>
  );
}
```

**Step 2: Verify fonts load**

Run: `npm run dev`

Open browser, inspect body — should see `--font-heading` and `--font-body` CSS variables applied. Text should render in Inter. No FOIT (text visible immediately with swap).

Expected: Fonts load, skip-to-content link visible when pressing Tab, tagline updated in page metadata.

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(brand): add Plus Jakarta Sans + Inter fonts, skip-to-content link, updated metadata, branded Sonner toasts"
```

---

## Task 3: Logo Components

**Files:**
- Create: `components/brand/logo-icon.tsx`
- Create: `components/brand/logo-wordmark.tsx`
- Create: `components/brand/logo.tsx`

**Step 1: Create logo-icon.tsx**

```tsx
"use client";

type Props = {
  size?: number;
  className?: string;
};

export function LogoIcon({ size = 48, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={`group ${className}`}
    >
      {/* Connection lines */}
      <line x1="12" y1="14" x2="30" y2="10" className="stroke-surface-700" strokeWidth="2.5" />
      <line x1="30" y1="10" x2="38" y2="28" className="stroke-surface-700" strokeWidth="2.5" />
      <line x1="38" y1="28" x2="18" y2="36" className="stroke-surface-700" strokeWidth="2.5" />
      <line x1="18" y1="36" x2="12" y2="14" className="stroke-surface-700" strokeWidth="2.5" />

      {/* Nodes with hover animation */}
      <circle
        cx="12" cy="14" r="5"
        className="fill-brand-500 transition-transform duration-300 origin-center motion-safe:group-hover:-translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
      />
      <circle
        cx="30" cy="10" r="5"
        className="fill-brand-300 transition-transform duration-300 origin-center motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
      />
      <circle
        cx="38" cy="28" r="5"
        className="fill-brand-400 transition-transform duration-300 origin-center motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:translate-y-0.5"
      />
      <circle
        cx="18" cy="36" r="5"
        className="fill-brand-600 transition-transform duration-300 origin-center motion-safe:group-hover:-translate-x-0.5 motion-safe:group-hover:translate-y-0.5"
      />
    </svg>
  );
}
```

**Step 2: Create logo-wordmark.tsx**

```tsx
type Props = {
  size?: number;
  className?: string;
};

export function LogoWordmark({ size = 20, className = "" }: Props) {
  return (
    <span
      className={`font-heading font-extrabold text-white ${className}`}
      style={{ fontSize: `${size}px` }}
    >
      Plex<span className="text-brand-400">ease</span>
    </span>
  );
}
```

**Step 3: Create logo.tsx**

```tsx
import { LogoIcon } from "./logo-icon";
import { LogoWordmark } from "./logo-wordmark";

type Props = {
  iconSize?: number;
  textSize?: number;
  className?: string;
};

export function Logo({ iconSize = 28, textSize = 20, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoIcon size={iconSize} />
      <LogoWordmark size={textSize} />
    </span>
  );
}
```

**Step 4: Verify components render**

Temporarily import `<Logo />` in any page, check it renders icon + wordmark with correct colours and hover animation.

**Step 5: Commit**

```bash
git add components/brand/
git commit -m "feat(brand): add LogoIcon, LogoWordmark, and Logo components with hover animation"
```

---

## Task 4: Favicon & Manifest

**Files:**
- Create: `app/icon.svg`
- Create: `app/manifest.ts`
- Delete: `app/favicon.ico`

**Step 1: Create SVG favicon**

`app/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <line x1="12" y1="14" x2="30" y2="10" stroke="#2e2946" stroke-width="2.5"/>
  <line x1="30" y1="10" x2="38" y2="28" stroke="#2e2946" stroke-width="2.5"/>
  <line x1="38" y1="28" x2="18" y2="36" stroke="#2e2946" stroke-width="2.5"/>
  <line x1="18" y1="36" x2="12" y2="14" stroke="#2e2946" stroke-width="2.5"/>
  <circle cx="12" cy="14" r="5" fill="#8b5cf6"/>
  <circle cx="30" cy="10" r="5" fill="#c4b5fd"/>
  <circle cx="38" cy="28" r="5" fill="#a78bfa"/>
  <circle cx="18" cy="36" r="5" fill="#7c3aed"/>
</svg>
```

**Step 2: Create manifest.ts**

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plexease",
    short_name: "Plexease",
    description: "Complex integrations, with ease",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a14",
    theme_color: "#0c0a14",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
```

**Step 3: Delete old favicon**

```bash
rm app/favicon.ico
```

**Step 4: Verify**

Run: `npm run dev`

Check browser tab — should show the 4-node icon instead of the Next.js default.

**Step 5: Commit**

```bash
git add app/icon.svg app/manifest.ts
git rm app/favicon.ico
git commit -m "feat(brand): add SVG favicon, web manifest, remove default favicon"
```

---

## Task 5: Landing Page — app/page.tsx

**Files:**
- Modify: `app/page.tsx`

**Step 1: Apply full brand to landing page**

Replace the full file with:

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isProUser } from "@/lib/subscription";
import { PricingSection } from "@/components/landing/pricing-section";
import { ManageCookiesButton } from "@/components/ui/manage-cookies-button";
import { Logo } from "@/components/brand/logo";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isPro = user ? await isProUser(user.id) : false;

  return (
    <main id="main-content" className="min-h-screen bg-surface-950 text-white">
      {/* Nav */}
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

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-6 py-24 text-center lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12)_0%,transparent_70%)]" />
        <div className="relative">
          <h1 className="font-heading text-5xl font-bold tracking-tight lg:text-6xl">
            Complex integrations,
            <br />
            <span
              className="animate-shimmer bg-[linear-gradient(110deg,#c4b5fd_35%,#e9d5ff_50%,#c4b5fd_65%)] bg-[length:200%_100%] bg-clip-text text-transparent motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-brand-300"
              style={{ WebkitBackgroundClip: "text", animationDuration: "3s", animationIterationCount: "infinite" }}
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

      {/* Footer */}
      <footer className="border-t border-surface-700 px-6 py-8 text-center text-sm text-muted-500">
        <p>&copy; {new Date().getFullYear()} Plexease. All rights reserved.</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <a href="/privacy" className="hover:text-muted-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-2 py-1">
            Privacy policy
          </a>
          <ManageCookiesButton />
        </div>
      </footer>
    </main>
  );
}
```

**Step 2: Verify**

Run: `npm run dev`, open landing page. Check:
- Logo renders in nav (icon + "Plexease")
- Purple buttons with glow
- Hero gradient visible behind heading
- "with ease" has shimmer animation
- Tool cards have hover lift
- All text uses muted/brand colours, no blue or raw gray remaining

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(brand): apply brand to landing page — logo, purple palette, shimmer tagline, hero gradient, card hover lift"
```

---

## Task 6: Sidebar

**Files:**
- Modify: `components/dashboard/sidebar.tsx`

**Step 1: Apply brand to sidebar**

Replace the full file with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { TierBadge } from "@/components/billing/tier-badge";
import { UsageCounter } from "@/components/billing/usage-counter";
import { Logo } from "@/components/brand/logo";
import { resetCookieConsent } from "@/components/ui/cookie-consent";
import type { UserPlan } from "@/lib/subscription";

const navItems = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/tools/nuget-advisor", label: "NuGet Advisor" },
];

type Props = {
  plan: UserPlan;
  usageCount: number;
};

export function Sidebar({ plan, usageCount }: Props) {
  const pathname = usePathname();
  const isPro = plan.plan === "pro";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-surface-700 bg-surface-950 px-4 py-6">
      <Link href="/dashboard" aria-label="Plexease dashboard" className="inline-block rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950">
        <Logo iconSize={24} textSize={18} />
      </Link>

      {/* Tier badge + usage */}
      <div className="mt-4 flex items-center gap-2">
        <TierBadge plan={plan.plan} />
        {!isPro && (
          <Link
            href="/upgrade"
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>
      <div className="mt-1">
        <UsageCounter isPro={isPro} usageCount={usageCount} />
      </div>

      <nav className="mt-6 flex-1 space-y-1">
        {navItems.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                isActive
                  ? "bg-surface-800 text-white"
                  : "text-muted-300 hover:bg-surface-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-700 pt-4 space-y-1">
        <button
          onClick={() => resetCookieConsent()}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-muted-400 hover:bg-surface-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          Manage cookies
        </button>
        <SignOutButton />
      </div>
    </aside>
  );
}
```

Note: `py-2` changed to `py-2.5` on nav items and buttons for 44px touch target compliance.

**Step 2: Verify**

Log in, check sidebar: logo renders, purple upgrade link, surface-coloured backgrounds, focus rings visible when tabbing.

**Step 3: Commit**

```bash
git add components/dashboard/sidebar.tsx
git commit -m "feat(brand): apply brand to sidebar — logo, surface colours, focus rings, touch targets"
```

---

## Task 7: Auth Components

**Files:**
- Modify: `components/auth/auth-header.tsx`
- Modify: `components/auth/login-form.tsx`
- Modify: `components/auth/signup-form.tsx`
- Modify: `components/auth/oauth-button.tsx`

**Step 1: Update auth-header.tsx**

```tsx
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function AuthHeader() {
  return (
    <div className="text-center">
      <Link href="/" aria-label="Plexease home" className="inline-block rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950">
        <Logo iconSize={32} textSize={24} />
      </Link>
    </div>
  );
}
```

**Step 2: Update login-form.tsx**

Apply these find-and-replace patterns throughout the file (do not change logic, only class strings):

| Find | Replace |
|------|---------|
| `bg-gray-950` | `bg-surface-950` |
| `bg-gray-900` | `bg-surface-900` |
| `bg-gray-800` | `bg-surface-800` |
| `border-gray-800` | `border-surface-700` |
| `border-gray-700` | `border-surface-700` |
| `text-gray-300` | `text-muted-300` |
| `text-gray-400` | `text-muted-400` |
| `text-gray-500` | `text-muted-500` |
| `placeholder-gray-500` | `placeholder-muted-500` |
| `bg-blue-600` | `bg-brand-500` |
| `hover:bg-blue-500` | `hover:bg-brand-600` |
| `text-blue-400` | `text-brand-400` |
| `hover:text-blue-300` | `hover:text-brand-300` |
| `text-blue-300` | `text-brand-300` |
| `focus:ring-blue-500` | `focus:ring-brand-500` |
| `focus:border-blue-500` | `focus:border-brand-500` |
| `focus:ring-1` | `focus:ring-2` |
| `hover:bg-gray-800` | `hover:bg-surface-800` |
| `focus:ring-offset-gray-900` | `focus:ring-offset-surface-950` |

Also add `font-heading` to any `<h1>` or `<h2>` headings.

**Step 3: Apply same patterns to signup-form.tsx**

Same find-and-replace as Step 2.

**Step 4: Apply same patterns to oauth-button.tsx**

Same find-and-replace. The Google SVG colours remain unchanged (those are Google's brand colours).

**Step 5: Verify**

Open `/login` and `/signup`. Check: branded header with logo, purple inputs/buttons, correct text colours, focus rings on Tab.

**Step 6: Commit**

```bash
git add components/auth/
git commit -m "feat(brand): apply brand to auth components — logo header, purple palette, focus rings"
```

---

## Task 8: Dashboard Content

**Files:**
- Modify: `components/dashboard/dashboard-content.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`

**Step 1: Update dashboard-content.tsx**

Apply the same colour migration patterns from Task 7 throughout the file. Key changes:

- `border-gray-700 bg-gray-800` → `border-surface-700 bg-surface-900`
- `text-gray-400` → `text-muted-400`
- `text-gray-500` → `text-muted-500`
- `text-blue-400` → `text-brand-400`
- `hover:text-blue-300` → `hover:text-brand-300`
- `hover:bg-gray-800` → `hover:bg-surface-800`
- Add `font-heading` to headings: `<h1>` and `<h3>` elements
- Add focus styles to the "Manage Subscription", "Upgrade to Pro", and "NuGet Advisor" links/buttons:
  `focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg`

**Step 2: Update dashboard/page.tsx**

Add `id="main-content"` to the wrapper element if not already present so skip-to-content works. Apply same colour patterns.

**Step 3: Verify**

Log in, check dashboard. Cards use surface colours, headings use Jakarta font, links are purple, focus rings visible.

**Step 4: Commit**

```bash
git add components/dashboard/dashboard-content.tsx app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat(brand): apply brand to dashboard — surface cards, Jakarta headings, purple links"
```

---

## Task 9: Billing Components (batch 1)

**Files:**
- Modify: `components/billing/tier-badge.tsx`
- Modify: `components/billing/usage-counter.tsx`
- Modify: `components/billing/usage-card.tsx`
- Modify: `components/billing/pricing-toggle.tsx`

**Step 1: Update tier-badge.tsx**

```tsx
type Props = {
  plan: "free" | "pro";
};

export function TierBadge({ plan }: Props) {
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold text-white">
        Pro
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-surface-700 px-2.5 py-0.5 text-xs font-semibold text-muted-300">
      Free
    </span>
  );
}
```

**Step 2: Update usage-counter.tsx**

```tsx
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

type Props = {
  isPro: boolean;
  usageCount: number;
};

export function UsageCounter({ isPro, usageCount }: Props) {
  if (isPro) {
    return <p className="text-xs text-muted-500">Unlimited</p>;
  }

  return (
    <p className="text-xs text-muted-500">
      {usageCount}/{FREE_MONTHLY_LIMIT} uses
    </p>
  );
}
```

**Step 3: Update usage-card.tsx**

Apply same colour migration patterns. Key changes:
- `bg-gray-800` → `bg-surface-900`
- `border-gray-700` → `border-surface-700`
- `text-gray-400` → `text-muted-400`
- `text-gray-500` → `text-muted-500`
- `bg-gray-700` (progress bar track) → `bg-surface-700`
- `text-blue-400` → `text-brand-400`
- `hover:text-blue-300` → `hover:text-brand-300`
- Usage bar fill colour: keep green/amber/red semantic colours for the progress bar
- Add `font-heading` to stat numbers and headings

**Step 4: Update pricing-toggle.tsx**

```tsx
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
```

**Step 5: Verify**

Check dashboard sidebar badges, usage text, and upgrade page toggle. All should use brand/surface/muted tokens.

**Step 6: Commit**

```bash
git add components/billing/tier-badge.tsx components/billing/usage-counter.tsx components/billing/usage-card.tsx components/billing/pricing-toggle.tsx
git commit -m "feat(brand): apply brand to tier badge, usage counter, usage card, pricing toggle"
```

---

## Task 10: Billing Components (batch 2)

**Files:**
- Modify: `components/billing/pricing-card.tsx`
- Modify: `components/billing/cancellation-banner.tsx`
- Modify: `components/billing/payment-failed-banner.tsx`
- Modify: `components/billing/feature-comparison.tsx`
- Modify: `components/billing/faq-section.tsx`

**Step 1: Apply colour migration patterns to all 5 files**

For each file, apply the standard find-and-replace from Task 7. Additional specifics:

**pricing-card.tsx:**
- Highlighted card: `border-blue-600` → `border-brand-500`, add `shadow-glow-lg`
- Badge: `bg-blue-600` → `bg-brand-500`
- Add `font-heading` to plan name and price
- Add hover lift: `transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg`

**cancellation-banner.tsx:**
- Keep `border-amber-700`, `text-amber-300`, `bg-amber-950/30` (semantic)
- Replace any `bg-gray-*` with surface equivalents
- Replace `bg-blue-600` resubscribe button → `bg-brand-500 hover:bg-brand-600`

**payment-failed-banner.tsx:**
- Keep `border-red-700`, `text-red-300`, `bg-red-950/30` (semantic)
- Replace any button blues with brand equivalents

**feature-comparison.tsx:**
- `bg-gray-900` → `bg-surface-900`
- `border-gray-800` → `border-surface-700`
- `text-gray-400` → `text-muted-400`
- Add `font-heading` to table header text

**faq-section.tsx:**
- `text-gray-400` → `text-muted-400`
- `text-gray-300` → `text-muted-300`
- Add `font-heading` to question headings

**Step 2: Verify**

Open `/upgrade` page. Pricing cards, feature comparison, and FAQ should all use brand colours. Pro card should have purple border + glow.

**Step 3: Commit**

```bash
git add components/billing/pricing-card.tsx components/billing/cancellation-banner.tsx components/billing/payment-failed-banner.tsx components/billing/feature-comparison.tsx components/billing/faq-section.tsx
git commit -m "feat(brand): apply brand to pricing card, banners, feature comparison, FAQ"
```

---

## Task 11: Upgrade & Checkout Pages

**Files:**
- Modify: `app/(dashboard)/upgrade/upgrade-content.tsx`
- Modify: `app/(dashboard)/upgrade/success/page.tsx`
- Modify: `components/landing/pricing-section.tsx`

**Step 1: Apply colour migration patterns to all 3 files**

Standard find-and-replace from Task 7. Additional:

**upgrade-content.tsx:**
- Add `font-heading` to page heading
- Replace any `bg-gray-900` card wrappers with `bg-surface-900`

**success/page.tsx:**
- Replace spinner/loading colours
- Replace `bg-gray-950` → `bg-surface-950`
- Replace success green text (keep green, it's semantic)

**pricing-section.tsx:**
- Same patterns as pricing-card
- Add `font-heading` to section heading
- Replace `bg-gray-950` section background → `bg-surface-950`

**Step 2: Verify**

Check `/upgrade` page and pricing section on landing page. Both should match.

**Step 3: Commit**

```bash
git add app/\(dashboard\)/upgrade/ components/landing/pricing-section.tsx
git commit -m "feat(brand): apply brand to upgrade page, checkout success, landing pricing section"
```

---

## Task 12: NuGet Advisor

**Files:**
- Modify: `app/(dashboard)/tools/nuget-advisor/page.tsx`
- Modify: `components/tools/nuget-advisor/advisor-form.tsx`
- Modify: `components/tools/nuget-advisor/result-cards.tsx` (if exists)

**Step 1: Update nuget-advisor/page.tsx**

- `text-gray-400` → `text-muted-400`
- Add `font-heading` to `<h1>`

**Step 2: Update advisor-form.tsx**

Apply standard colour migration. Key changes:

- Input: `border-gray-700 bg-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500` → `border-surface-700 bg-surface-800 placeholder-muted-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500`
- Button: `bg-blue-600 hover:bg-blue-500` → `bg-brand-500 hover:bg-brand-600 shadow-glow`
- Upgrade prompt: `bg-blue-600 hover:bg-blue-500` → `bg-brand-500 hover:bg-brand-600 shadow-glow`
- `text-gray-400` → `text-muted-400`
- `text-gray-500` → `text-muted-500`
- `text-gray-300` → `text-muted-300`
- Keep `border-yellow-700 bg-yellow-950/30 text-yellow-300` on usage limit warning (semantic)

**Step 3: Update result-cards.tsx if it exists**

Apply same patterns to any gray/blue references.

**Step 4: Verify**

Navigate to NuGet Advisor. Form, input, button, and limit warning should use brand colours.

**Step 5: Commit**

```bash
git add app/\(dashboard\)/tools/ components/tools/
git commit -m "feat(brand): apply brand to NuGet Advisor — form, results, usage limit"
```

---

## Task 13: UI Components & Cookie Consent

**Files:**
- Modify: `components/ui/spinner.tsx`
- Modify: `components/ui/cookie-consent.tsx`
- Modify: `components/ui/manage-cookies-button.tsx`
- Modify: `components/dashboard/sign-out-button.tsx`

**Step 1: Update spinner.tsx**

```tsx
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-surface-700 border-t-brand-500 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
```

**Step 2: Update cookie-consent.tsx**

Apply standard colour migration:

- `border-gray-800 bg-gray-950` → `border-surface-700 bg-surface-950`
- `text-gray-400` → `text-muted-400`
- `text-blue-400 hover:text-blue-300` → `text-brand-400 hover:text-brand-300`
- `border-gray-700` → `border-surface-700`
- `text-gray-300` → `text-muted-300`
- `hover:bg-gray-800` → `hover:bg-surface-800`
- `bg-blue-600 hover:bg-blue-500` → `bg-brand-500 hover:bg-brand-600`
- Add focus ring styles to both buttons:
  `focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950`

**Step 3: Update manage-cookies-button.tsx**

Apply colour migration to any gray/blue classes.

**Step 4: Update sign-out-button.tsx**

Apply colour migration. Add focus ring styles.

**Step 5: Verify**

Check cookie consent banner (clear cookies to trigger it), spinner (loading states), sign out button in sidebar.

**Step 6: Commit**

```bash
git add components/ui/ components/dashboard/sign-out-button.tsx
git commit -m "feat(brand): apply brand to spinner, cookie consent, manage cookies, sign out button"
```

---

## Task 14: Error & Loading Pages

**Files:**
- Modify: `app/error.tsx`
- Modify: `app/not-found.tsx`
- Modify: `app/global-error.tsx`
- Modify: `app/loading.tsx`
- Modify: `app/(dashboard)/dashboard/loading.tsx`

**Step 1: Update error.tsx**

Apply standard colour migration:

- `bg-gray-950` → `bg-surface-950`
- `text-gray-400` → `text-muted-400`
- `bg-blue-600 hover:bg-blue-500` → `bg-brand-500 hover:bg-brand-600 shadow-glow`
- `border-gray-700` → `border-surface-700`
- `text-gray-300` → `text-muted-300`
- `hover:bg-gray-800` → `hover:bg-surface-800`
- Add `font-heading` to `<h1>`
- Add focus ring styles to all buttons/links

**Step 2: Update not-found.tsx**

Same patterns as error.tsx.

**Step 3: Update global-error.tsx**

Update inline style hex values (no Tailwind available here):

- `backgroundColor: "#030712"` → `"#0c0a14"`
- `color: "#9ca3af"` → `"#9490ad"`
- `color: "#f87171"` → keep (semantic error red)
- `backgroundColor: "#2563eb"` → `"#8b5cf6"`
- `border: "1px solid #374151"` → `"1px solid #2e2946"`
- `color: "#d1d5db"` → `"#b8b4cc"`

**Step 4: Update loading.tsx**

- `bg-gray-950` → `bg-surface-950`

**Step 5: Update dashboard/loading.tsx**

No colour classes on the wrapper (it inherits). The Spinner component was already updated in Task 13.

**Step 6: Verify**

Navigate to a non-existent page to check 404. Trigger error boundary if possible. Check loading states.

**Step 7: Commit**

```bash
git add app/error.tsx app/not-found.tsx app/global-error.tsx app/loading.tsx app/\(dashboard\)/dashboard/loading.tsx
git commit -m "feat(brand): apply brand to error pages, not-found, global-error, loading states"
```

---

## Task 15: Auth Pages (check-email, reset-password)

**Files:**
- Modify: `app/(auth)/check-email/page.tsx`
- Modify: `app/(auth)/reset-password/page.tsx`

**Step 1: Apply standard colour migration to both files**

Same patterns from Task 7. Add `font-heading` to headings. Add focus ring styles to links/buttons.

**Step 2: Verify**

Navigate to `/check-email` and `/reset-password`. Verify brand colours.

**Step 3: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat(brand): apply brand to check-email and reset-password pages"
```

---

## Task 16: OG Image

**Files:**
- Create: `app/opengraph-image.tsx`
- Create: `public/fonts/` directory with font files

**Step 1: Download font files**

```bash
mkdir -p public/fonts
# Download Plus Jakarta Sans ExtraBold and Inter Regular
curl -L "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU79TR_V.woff2" -o public/fonts/PlusJakartaSans-ExtraBold.woff2
curl -L "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKv8ZpmoUhFUY.woff2" -o public/fonts/Inter-Regular.woff2
```

Note: If these URLs are outdated, find current URLs from Google Fonts API or download directly from fonts.google.com.

**Step 2: Create opengraph-image.tsx**

```tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Plexease — Complex integrations, with ease";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const jakartaFont = fetch(
    new URL("../public/fonts/PlusJakartaSans-ExtraBold.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const interFont = fetch(
    new URL("../public/fonts/Inter-Regular.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const [jakartaData, interData] = await Promise.all([jakartaFont, interFont]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c0a14",
          backgroundImage: "radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)",
        }}
      >
        {/* Logo icon */}
        <svg width="80" height="80" viewBox="0 0 48 48" fill="none">
          <line x1="12" y1="14" x2="30" y2="10" stroke="#2e2946" strokeWidth="2.5" />
          <line x1="30" y1="10" x2="38" y2="28" stroke="#2e2946" strokeWidth="2.5" />
          <line x1="38" y1="28" x2="18" y2="36" stroke="#2e2946" strokeWidth="2.5" />
          <line x1="18" y1="36" x2="12" y2="14" stroke="#2e2946" strokeWidth="2.5" />
          <circle cx="12" cy="14" r="5" fill="#8b5cf6" />
          <circle cx="30" cy="10" r="5" fill="#c4b5fd" />
          <circle cx="38" cy="28" r="5" fill="#a78bfa" />
          <circle cx="18" cy="36" r="5" fill="#7c3aed" />
        </svg>

        {/* Wordmark */}
        <div style={{ marginTop: 24, display: "flex", fontFamily: "Jakarta", fontSize: 48, fontWeight: 800 }}>
          <span style={{ color: "#ffffff" }}>Plex</span>
          <span style={{ color: "#a78bfa" }}>ease</span>
        </div>

        {/* Tagline */}
        <div style={{ marginTop: 16, fontFamily: "Inter", fontSize: 24, color: "#9490ad" }}>
          Complex integrations, with ease
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Jakarta", data: jakartaData, style: "normal", weight: 800 },
        { name: "Inter", data: interData, style: "normal", weight: 400 },
      ],
    }
  );
}
```

**Step 3: Verify**

Run: `npm run dev`

Navigate to: `http://localhost:3000/opengraph-image`

Expected: 1200x630 PNG with dark background, radial gradient, logo icon, "Plexease" wordmark, and tagline.

**Step 4: Commit**

```bash
git add app/opengraph-image.tsx public/fonts/
git commit -m "feat(brand): add OG image with logo, wordmark, tagline, and bundled fonts"
```

---

## Task 17: Final Sweep — Grep for Remaining Blue/Gray

**Files:**
- Any files still containing old colour classes

**Step 1: Search for remaining old classes**

```bash
cd /home/deck/Projects/plexease
grep -rn --include="*.tsx" --include="*.ts" -E "(blue-[0-9]|gray-[0-9])" app/ components/ --exclude-dir=node_modules | grep -v ".next"
```

Expected: No results (all migrated). If any remain, apply the standard colour migration.

**Step 2: Fix any remaining occurrences**

Apply the migration table from the design doc Section 5.1.

**Step 3: Commit if changes were made**

```bash
git add -A
git commit -m "fix(brand): migrate remaining blue/gray references to brand/surface/muted tokens"
```

---

## Task 18: Accessibility Audit

**Files:**
- Potentially any file that needs fixes

**Step 1: Run the dev server**

```bash
cd /home/deck/Projects/plexease && npm run dev
```

**Step 2: Keyboard navigation test**

Open each page and navigate using Tab/Shift+Tab. Verify:
- [ ] Skip-to-content link appears on first Tab press
- [ ] All interactive elements have visible purple focus rings
- [ ] No focus traps
- [ ] Tab order follows visual order

**Step 3: Heading hierarchy check**

Open browser dev tools, run in console:
```js
document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => console.log(h.tagName, h.textContent))
```

Verify no skipped levels on: landing page, dashboard, NuGet Advisor, upgrade page, auth pages.

**Step 4: Contrast spot-check**

In browser dev tools, use the accessibility inspector or Lighthouse to check:
- `muted-500` text never appears on `surface-800` backgrounds
- All text/background combos meet WCAG AA (4.5:1 normal, 3:1 large)

**Step 5: Touch target audit**

Verify all buttons/links are at least 44x44px using dev tools element inspector.

**Step 6: Fix any issues found**

**Step 7: Commit if changes were made**

```bash
git add -A
git commit -m "fix(a11y): fix issues found during accessibility audit"
```

---

## Task 19: Visual Review

**Step 1: Start dev server and open all pages**

Open in Firefox and review each page:
1. Landing page (hero, tools, pricing, footer)
2. Login / signup
3. Check-email / reset-password
4. Dashboard (free user)
5. Dashboard (pro user, if possible)
6. NuGet Advisor
7. Upgrade page
8. 404 page
9. Cookie consent banner (clear cookies first)

**Step 2: Check for visual consistency**

- All backgrounds use surface-950/900/800 (no raw grays)
- All buttons are purple with glow
- All links are brand-400
- All headings use Plus Jakarta Sans
- All body text uses Inter
- Logo appears correctly in nav, sidebar, auth header
- Shimmer animation plays on hero tagline
- Card hover lift works
- Reduced motion: disable animations in OS settings, verify shimmer shows static purple, cards don't lift

**Step 3: Fix any issues found**

**Step 4: Commit if changes were made**

```bash
git add -A
git commit -m "fix(brand): visual consistency fixes from review"
```

---

## Task 20: Run Existing Tests

**Step 1: Run Playwright tests to check nothing is broken**

```bash
cd /home/deck/Projects/plexease && npx playwright test
```

Expected: All 18 tests pass. If any fail due to changed selectors (e.g., tests checking for specific text colours or class names), update the test selectors.

**Step 2: Fix any test failures**

Tests may need updating if they assert on:
- Specific CSS classes (unlikely — POM pattern uses semantic selectors)
- Text content (tagline changed from "made easy" to "with ease")
- Visual selectors tied to colour

**Step 3: Commit if changes were made**

```bash
git add -A
git commit -m "fix(test): update test selectors for Phase 5 brand changes"
```

---

## Task 21: Final Commit & Cleanup

**Step 1: Clean up temp files**

```bash
rm -f /tmp/plexease-colours.html /tmp/plexease-fonts.html /tmp/plexease-font-pairing.html /tmp/plexease-logos.html
```

**Step 2: Verify git status is clean**

```bash
git status
```

Expected: Clean working tree, all changes committed.

**Step 3: Update PLEXEASE.md**

Update the "Current Status" section:
- Phase: 5 complete
- Last action: Phase 5 branding — purple colour system, Plus Jakarta Sans + Inter typography, organic cluster logo, visual polish, accessibility improvements
- Next step: Phase 6 — Marketing & Trust

Mark Phase 5 checkboxes as complete.

**Step 4: Commit**

```bash
git add PLEXEASE.md
git commit -m "docs: update PLEXEASE.md — Phase 5 complete, ready for Phase 6"
```
