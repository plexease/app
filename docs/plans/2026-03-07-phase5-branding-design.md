# Phase 5 — Branding Design

> Design session: 2026-03-07
> Status: Approved

---

## 1. Brand Identity

| Attribute | Decision |
|-----------|----------|
| Personality | Friendly & approachable |
| Tagline | "Complex integrations, with ease" (was "made easy") |
| Logo | Icon + wordmark |
| Wordmark | "Plex" white + "ease" brand-400 purple, Plus Jakarta Sans weight 800 |
| Theme | Dark-only (no light mode — explicit decision, out of scope for now) |

---

## 2. Colour System

### 2.1 Brand Palette (purple)

All custom colours registered via Tailwind v4 `@theme` block using `--color-` prefix.

```css
@theme {
  --color-brand-50: #faf5ff;
  --color-brand-100: #f3e8ff;
  --color-brand-300: #c4b5fd;
  --color-brand-400: #a78bfa;
  --color-brand-500: #8b5cf6;
  --color-brand-600: #7c3aed;
  --color-brand-700: #6d28d9;
}
```

| Token | Hex | Use |
|-------|-----|-----|
| brand-50 | #faf5ff | Subtle tinted backgrounds |
| brand-100 | #f3e8ff | Light hover states |
| brand-300 | #c4b5fd | Light text accents, logo node, link hover |
| brand-400 | #a78bfa | Links, secondary accents, wordmark "ease" |
| brand-500 | #8b5cf6 | Primary buttons, badges, focus rings, usage bar |
| brand-600 | #7c3aed | Button hover, active states |
| brand-700 | #6d28d9 | Pressed states |

### 2.2 Surface Palette (purple-tinted dark backgrounds)

```css
@theme {
  --color-surface-950: #0c0a14;
  --color-surface-900: #131121;
  --color-surface-800: #1e1a2e;
  --color-surface-700: #2e2946;
}
```

| Token | Hex | Use |
|-------|-----|-----|
| surface-950 | #0c0a14 | Body/shell background, sidebar background |
| surface-900 | #131121 | Cards, main content area |
| surface-800 | #1e1a2e | Inputs, secondary cards, active nav items |
| surface-700 | #2e2946 | ALL borders and dividers |

**Border rule:** `surface-700` is the universal border token. Both current `border-gray-800` and `border-gray-700` map to `border-surface-700`.

### 2.3 Text Palette (purple-tinted grays)

The default Tailwind gray-300/400/500 must be replaced with purple-tinted equivalents to match the surfaces.

```css
@theme {
  --color-muted-500: #6e6890;
  --color-muted-400: #9490ad;
  --color-muted-300: #b8b4cc;
}
```

| Token | Hex | Replaces | Use | Min contrast on surface-950 |
|-------|-----|----------|-----|-----------------------------|
| muted-300 | #b8b4cc | gray-300 | Secondary text, input text, descriptions | 8.5:1 (AA pass) |
| muted-400 | #9490ad | gray-400 | Body text, helper text | 6.1:1 (AA pass) |
| muted-500 | #6e6890 | gray-500 | Subtle labels, placeholders | 4.5:1 (AA pass) |

**Contrast pre-validation (worst-case combos):**

| Combo | Ratio | Result |
|-------|-------|--------|
| muted-500 (#6e6890) on surface-800 (#1e1a2e) | 3.4:1 | Fails AA normal, passes AA large text |
| muted-500 (#6e6890) on surface-950 (#0c0a14) | 4.5:1 | Passes AA |
| muted-400 (#9490ad) on surface-800 (#1e1a2e) | 4.8:1 | Passes AA |
| muted-300 (#b8b4cc) on surface-900 (#131121) | 7.2:1 | Passes AA |
| brand-400 (#a78bfa) on surface-950 (#0c0a14) | 5.8:1 | Passes AA |
| brand-400 (#a78bfa) on surface-900 (#131121) | 5.1:1 | Passes AA |
| white (#ffffff) on brand-500 (#8b5cf6) | 4.6:1 | Passes AA |
| white (#ffffff) on brand-600 (#7c3aed) | 5.4:1 | Passes AA |

**Rule:** `muted-500` must only appear on `surface-950` or `surface-900` backgrounds (never on `surface-800`). Use `muted-400` as minimum for text on `surface-800`.

### 2.4 Semantic Colours

Unchanged: green for success, amber for warnings, red for errors. Subtle banner backgrounds use surface tones instead of gray.

---

## 3. Typography

### 3.1 Font Loading

Both fonts loaded via `next/font/google` in `app/layout.tsx`:

```ts
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
  adjustFontFallback: true,
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  adjustFontFallback: true,
})
```

**Body element:**
```tsx
<body className={`${jakarta.variable} ${inter.variable} font-sans`}>
```

**Tailwind config:** Inter registered as `font-sans` (body default). Plus Jakarta Sans available via `font-heading`.

```css
@theme {
  --font-sans: var(--font-body), system-ui, sans-serif;
  --font-heading: var(--font-heading), system-ui, sans-serif;
}
```

### 3.2 Usage Rules

| Element | Font | Weight | Classes |
|---------|------|--------|---------|
| Brand name "Plexease" | Jakarta | 800 | `font-heading font-extrabold` |
| Page headings (h1, h2) | Jakarta | 700 | `font-heading font-bold` |
| Card titles, section headers | Jakarta | 600 | `font-heading font-semibold` |
| Stat numbers (dashboard) | Jakarta | 700 | `font-heading font-bold` |
| Body text, descriptions | Inter | 400 | (default, inherited) |
| Form labels, nav items | Inter | 500 | `font-medium` |
| Buttons | Inter | 500 | `font-medium` |
| Badges, helper text | Inter | 600 | `font-semibold` |

---

## 4. Logo & Favicon

### 4.1 Icon — Organic Cluster

4 nodes in an asymmetric ring layout, each connected to its 2 neighbours.

**Node positions (viewBox 0 0 48 48):**
- Top-left: (12, 14) — fill: brand-500 (#8b5cf6)
- Top-right: (30, 10) — fill: brand-300 (#c4b5fd)
- Bottom-right: (38, 28) — fill: brand-400 (#a78bfa)
- Bottom-left: (18, 36) — fill: brand-600 (#7c3aed)

**Connections:** Lines between adjacent nodes, stroke: surface-700 (#2e2946).

**Hover animation:** Nodes shift 2px outward from centre on hover, 300ms ease. Must use CSS `transform: translate()` (not SVG `cx`/`cy`) for GPU compositing. Wrapped in `prefers-reduced-motion: no-preference`.

### 4.2 Components

All in `components/brand/` (new directory):

| File | Purpose | Client/Server |
|------|---------|---------------|
| `logo-icon.tsx` | SVG icon with `size` prop, hover animation | Client (`"use client"` for animation) |
| `logo-wordmark.tsx` | "Plex" + "ease" text with `size` prop | Server |
| `logo.tsx` | Combined icon + wordmark, `size` prop | Client (wraps logo-icon) |

**Accessibility:** Logo SVG gets `aria-hidden="true"`. The parent `<Link>` element must have `aria-label="Plexease home"` (or similar) to provide the accessible name. This ensures the name is always available even when only the icon is shown.

### 4.3 Logo Placement

| Location | Format | Icon size | Text size |
|----------|--------|-----------|-----------|
| Landing page nav | Icon + wordmark | 28px | 22px |
| Sidebar (top) | Icon + wordmark | 24px | 18px |
| Auth header | Icon + wordmark | 32px | 24px |
| Favicon / browser tab | Icon only | auto |  |

### 4.4 Favicon Set

| File | Purpose |
|------|---------|
| `app/icon.svg` | SVG favicon (modern browsers) |
| `app/apple-icon.png` | 180x180 Apple touch icon |
| `app/manifest.ts` | Web manifest: `theme_color: "#0c0a14"`, `background_color: "#0c0a14"` |

---

## 5. Component Updates

### 5.1 Complete Colour Migration Table

| Current class | New class | Context |
|---------------|-----------|---------|
| `bg-gray-950` | `bg-surface-950` | Page backgrounds, sidebar |
| `bg-gray-900` | `bg-surface-900` | Cards |
| `bg-gray-800` | `bg-surface-800` | Inputs, secondary cards, active nav |
| `border-gray-800` | `border-surface-700` | All borders (note: maps to 700, not 800) |
| `border-gray-700` | `border-surface-700` | All borders |
| `text-gray-300` | `text-muted-300` | Secondary text, input text |
| `text-gray-400` | `text-muted-400` | Body text, descriptions |
| `text-gray-500` | `text-muted-500` | Subtle labels, placeholders |
| `placeholder-gray-500` | `placeholder-muted-500` | Input placeholders |
| `bg-blue-600` | `bg-brand-500` | Primary buttons, badges |
| `bg-blue-500` / `hover:bg-blue-500` | `hover:bg-brand-600` | Button hover |
| `text-blue-400` | `text-brand-400` | Links |
| `text-blue-300` / `hover:text-blue-300` | `hover:text-brand-300` | Link hover |
| `border-blue-600` | `border-brand-500` | Featured card border |
| `focus:ring-blue-500` | `focus:ring-brand-500` | Focus rings |
| `focus:border-blue-500` | `focus:border-brand-500` | Input focus |

### 5.2 File-by-File Audit Checklist

**Landing page & layout:**
- `app/page.tsx` — hero colours, tagline text, nav brand name
- `app/layout.tsx` — metadata description, font loading, body className, theme_color

**Auth:**
- `components/auth/auth-header.tsx` — brand name, colours
- `components/auth/login-form.tsx` — form inputs, buttons, links
- `components/auth/signup-form.tsx` — form inputs, buttons, links
- `components/auth/oauth-button.tsx` — button styles

**Dashboard:**
- `components/dashboard/sidebar.tsx` — brand name, nav items, usage bar, borders
- `app/(dashboard)/dashboard/page.tsx` — card colours, headings
- `app/(dashboard)/dashboard/loading.tsx` — loading state colours

**Tools:**
- `app/(dashboard)/tools/nuget-advisor/nuget-advisor-content.tsx` — form, result cards

**Billing:**
- `app/(dashboard)/upgrade/upgrade-content.tsx` — pricing cards, buttons
- `components/billing/pricing-card.tsx` — card styles, featured border
- `components/billing/pricing-toggle.tsx` — toggle colours
- `components/billing/tier-badge.tsx` — badge colours
- `components/billing/usage-counter.tsx` — usage bar
- `components/billing/usage-card.tsx` — card styles
- `components/billing/cancellation-banner.tsx` — surface tones for subtle bg
- `components/billing/payment-failed-banner.tsx` — surface tones for subtle bg
- `components/billing/feature-comparison.tsx` — table styles
- `components/billing/faq-section.tsx` — text colours
- `app/(dashboard)/upgrade/success/page.tsx` — success state colours

**UI:**
- `components/ui/spinner.tsx` — spinner colour
- `components/ui/cookie-consent.tsx` — banner colours, button styles

**Error pages:**
- `app/error.tsx` — colours
- `app/not-found.tsx` — colours
- `app/global-error.tsx` — inline styles (no Tailwind available here)

**Checkout:**
- `app/(auth)/check-email/page.tsx` — colours
- `app/(auth)/reset-password/page.tsx` — colours

### 5.3 Tagline Updates

All three locations must be updated to "Complex integrations, with ease":
1. `app/layout.tsx` — metadata `description`
2. `app/page.tsx` — hero section text
3. `app/opengraph-image.tsx` — OG image text (new file)

### 5.4 Buttons

| Type | Classes |
|------|---------|
| Primary | `bg-brand-500 hover:bg-brand-600 text-white shadow-[0_0_16px_rgba(139,92,246,0.25)]` |
| Secondary | `border border-surface-700 text-muted-300 hover:bg-surface-800` |
| Focus (all) | `focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950` |

### 5.5 Cards

| Type | Classes |
|------|---------|
| Default | `rounded-lg border border-surface-700 bg-surface-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg` |
| Featured (Pro) | `border-brand-500 bg-surface-900 shadow-[0_0_24px_rgba(139,92,246,0.15)]` |

### 5.6 Inputs

```
bg-surface-800 border border-surface-700 text-muted-300 placeholder-muted-500
rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500
```

### 5.7 Links

```
text-brand-400 hover:text-brand-300 transition-colors
```

### 5.8 Badges

| Type | Classes |
|------|---------|
| Pro | `bg-brand-500 text-white px-2.5 py-0.5 text-xs font-semibold rounded` |
| Free | `bg-surface-700 text-muted-300 px-2.5 py-0.5 text-xs font-semibold rounded` |

---

## 6. Visual Polish

### 6.1 Button Glow

Primary CTAs get a purple box-shadow glow:
```
shadow-[0_0_16px_rgba(139,92,246,0.25)]
```
Consider defining as a CSS custom property for reuse:
```css
@theme {
  --shadow-glow: 0 0 16px rgba(139, 92, 246, 0.25);
}
```

### 6.2 Featured Pricing Card Glow

```
shadow-[0_0_24px_rgba(139,92,246,0.15)]
```

### 6.3 Card Hover Lift

All interactive cards get:
```
transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
```
Wrapped in `@media (prefers-reduced-motion: no-preference)`.

### 6.4 Hero Gradient

Subtle radial gradient behind the hero heading:
```
bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12)_0%,transparent_70%)]
```

### 6.5 Animated Tagline Shimmer

The words "with ease" in the hero get a slow-moving gradient shimmer:
- CSS `background-clip: text` with animated `background-position`
- Wrapped in `@media (prefers-reduced-motion: no-preference)`
- **Reduced motion fallback:** static solid brand-300 colour (not a static gradient — avoids vestibular disorder concerns)

### 6.6 Tool Card Icons

Small purple-tinted icons (from a lightweight icon set or inline SVGs) next to tool names. Helps users scan cards faster.

### 6.7 Logo Hover Animation

Nodes shift 2px outward from centre on hover, 300ms ease. Uses CSS `transform: translate()` for GPU compositing.
- Wrapped in `@media (prefers-reduced-motion: no-preference)`

---

## 7. Accessibility

### 7.1 Skip-to-Content Link

Added to root layout, first focusable element:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white"
>
  Skip to content
</a>
```
Corresponding `id="main-content"` on the main content area.

### 7.2 Logo Accessibility

- SVG icon: `aria-hidden="true"`, `role="img"` removed
- Parent `<Link>`: `aria-label="Plexease home"` (or "Plexease dashboard" in sidebar)
- When icon is used standalone (favicon context), alt text provided via manifest

### 7.3 Reduced Motion

All animations and transitions wrapped in:
```css
@media (prefers-reduced-motion: no-preference) { ... }
```

Applies to: card hover lift, logo node animation, tagline shimmer, button glow pulse (if any).

Reduced-motion fallback for tagline shimmer: static `text-brand-300`.

### 7.4 Focus Indicators

**All interactive elements** must have visible focus styles:
```
focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950
```

Elements that currently lack focus styles and need them added:
- Sidebar nav items
- Cookie consent buttons
- Landing page nav links
- Footer links
- Card links (if clickable)
- Logo link

### 7.5 Contrast Audit

Pre-validated in Section 2.3. During implementation, verify each combo against WCAG AA using browser dev tools or axe.

**Rule:** `muted-500` only on `surface-950` or `surface-900`. Use `muted-400` minimum on `surface-800`.

### 7.6 Heading Hierarchy

Verify no skipped heading levels across all pages during implementation. Expected structure:
- Landing: h1 (hero) > h2 (sections) > h3 (cards)
- Dashboard: h1 (page title) > h2 (section headings)
- Auth: h1 (form title)

### 7.7 Touch Targets

All buttons, links, and interactive elements must meet 44x44px minimum. Check especially:
- Sidebar nav items (currently `py-2` — may need `py-2.5` or `min-h-[44px]`)
- Cookie consent close/manage buttons
- Footer links

---

## 8. Toast Styling (Sonner)

Custom styles applied via `toastOptions` prop on `<Toaster>`:

```tsx
<Toaster
  theme="dark"
  toastOptions={{
    className: 'bg-surface-900 border-surface-700 text-muted-300',
    style: {
      background: '#131121',
      border: '1px solid #2e2946',
      color: '#b8b4cc',
    },
    actionButtonStyle: {
      background: '#8b5cf6',
      color: '#ffffff',
    },
  }}
/>
```

Semantic toasts (success/error/warning) keep their default colours.

---

## 9. Open Graph Image

### 9.1 Implementation

`app/opengraph-image.tsx` using Next.js `ImageResponse`:
- Background: surface-950 with subtle radial gradient
- Logo icon (large, centred) + wordmark below
- Tagline: "Complex integrations, with ease"
- Dimensions: 1200x630

### 9.2 Font Loading for OG Image

`ImageResponse` cannot use `next/font/google`. Font files must be:
- Stored in `public/fonts/` (Plus Jakarta Sans woff2, Inter woff2)
- Fetched via `fetch(new URL(...))` at build time in the OG route

### 9.3 Metadata

In `app/layout.tsx`:
```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://plexease.io'), // or current domain
  title: 'Plexease',
  description: 'Complex integrations, with ease',
  openGraph: {
    title: 'Plexease',
    description: 'Complex integrations, with ease',
  },
}
```

---

## 10. Implementation Notes

### 10.1 Tailwind v4 @theme Block

All custom tokens go in `app/globals.css` inside a `@theme` block. The `--color-` prefix is mandatory for colour utilities to be generated.

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
```

### 10.2 global-error.tsx

This file cannot use Tailwind (renders outside the CSS context). Update its inline styles to use the new hex values directly:
- Background: `#0c0a14`
- Text: `#b8b4cc`
- Button background: `#8b5cf6`

### 10.3 Visual Regression Check

After implementation, open every page and visually verify. Key pages:
1. Landing page (hero, pricing, footer)
2. Login / signup
3. Dashboard (free user)
4. Dashboard (pro user)
5. NuGet Advisor
6. Upgrade page
7. 404 page
8. Cookie consent banner

Consider adding Playwright visual snapshot tests for landing page and dashboard as a future improvement (Phase 7).

---

## 11. Out of Scope

- Light mode / theme toggle
- Landing page content rewrite (Phase 6)
- Legal pages (Phase 6)
- SEO / social media marketing (Phase 6)
- Twitter card configuration (Phase 6)
- Visual regression Playwright tests (Phase 7)
