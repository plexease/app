# Phase 6 — Marketing & Trust: Design Document

> Date: 2026-03-07
> Phase: 6 of Plexease build
> Approach: Static legal pages, file-based SEO (Approach A)

---

## Scope

1. Landing page light refresh — "How it works" section, Claude AI attribution strip, enhanced footer
2. Legal pages — Terms of Service + Privacy Policy (generated draft, UK sole trader context)
3. Trust signals — "Powered by Claude AI" badge, no fake testimonials
4. SEO fundamentals — meta tags, JSON-LD, sitemap.xml, robots.txt, canonical URLs
5. Social card metadata — OG + Twitter card tags (no social accounts needed)
6. Apple touch icon — 180x180 PNG for iOS bookmarks

---

## 1. Landing Page Refresh

### Current flow

Nav > Hero > Tools > Pricing > Footer

### New flow

Nav > Hero > How It Works > Tools > Pricing > Attribution Strip > Footer

### "How it works" section

Three-step horizontal layout (`md:grid-cols-3`, stacked on mobile). Placed between Hero and Tools.

| Step | Heading | Description |
|------|---------|-------------|
| 1 | Pick a tool | Choose from our growing suite of integration tools |
| 2 | Describe your problem | Enter your package, API, or integration question |
| 3 | Get AI-powered answers | Receive detailed analysis, alternatives, and actionable advice |

Each step: number badge (`brand-500` circle), heading (`font-heading font-semibold`), description (`text-muted-400`). Card pattern: `bg-surface-900 border-surface-700`.

Optional: dashed connector line between step badges on desktop (hidden on mobile).

### Attribution strip

Centered text above the footer:

> Powered by Claude AI from Anthropic

Styled: `text-muted-500`, small text. "Anthropic" links to `https://www.anthropic.com`. Text only, no logos.

### Footer enhancement

Current: copyright + privacy link + manage cookies.

New layout — multi-column on `md:`, stacked on mobile:

- **Left:** Logo (small) + "Complex integrations, with ease" + copyright
- **Product column:** Tools (`#tools`), Pricing (`#pricing`)
- **Legal column:** Terms of Service (`/terms`), Privacy Policy (`/privacy`), Manage Cookies

---

## 2. Legal Pages

### Shared structure

Both `/terms` and `/privacy` share:

- Landing nav (extracted to `components/landing/nav.tsx`)
- Content: `max-w-3xl mx-auto px-6 py-16`
- Title: `font-heading text-3xl font-bold`
- "Last updated" date: `text-muted-500`
- Section headings: `font-heading text-xl font-semibold mt-10 mb-4`
- Body: `text-muted-300 leading-relaxed`
- Landing footer (extracted to `components/landing/footer.tsx`)

### Terms of Service sections

1. Acceptance of Terms
2. Description of Service (AI-powered integration tools)
3. Account Registration (Supabase Auth)
4. Free & Pro Plans (usage limits, pricing)
5. Payment Terms (Stripe, GBP, cancellation/refund policy)
6. Acceptable Use (no abuse of AI tools, no scraping)
7. Intellectual Property (user retains inputs, Plexease owns platform)
8. AI Disclaimer (outputs are informational, not professional advice)
9. Limitation of Liability
10. Termination
11. Governing Law (England & Wales)
12. Contact Information

### Privacy Policy sections

1. Data Controller (sole trader, UK)
2. Data We Collect (email, usage data, payment info via Stripe)
3. How We Use Your Data (auth, billing, AI tool processing)
4. Third-Party Processors (Supabase, Stripe, Anthropic/Claude, Vercel)
5. Cookies (consent-based, what they store)
6. Data Retention
7. Your Rights (GDPR: access, rectify, delete, port, object)
8. International Transfers (Supabase/Stripe/Anthropic are US-based)
9. Children's Privacy (not designed for under-16s)
10. Changes to This Policy
11. Contact Information

---

## 3. SEO & Social Cards

### Meta tags (`layout.tsx`)

Enhanced metadata export:

- `title`: `{ default: "Plexease", template: "%s | Plexease" }`
- `description`: AI-powered integration tools for .NET developers, tech support staff, and small businesses
- `keywords`: NuGet, .NET, integration tools, AI, package advisor, code generation
- `metadataBase`: Vercel deployment URL (swap to `plexease.io` when domain purchased)
- `openGraph`: title, description, url, siteName, locale `en_GB`, type `website`
- `twitter`: `summary_large_image` card type, title, description
- `robots`: index true, follow true

Legal pages get own `metadata` exports with `title` (template fills in ` | Plexease`) and `alternates.canonical`.

### sitemap.ts

Dynamic sitemap at `app/sitemap.ts`. Public routes only:

- `/`
- `/terms`
- `/privacy`
- `/login`
- `/signup`

Excludes: dashboard, API routes, auth callbacks.

### robots.ts

- Allow all crawlers on public routes
- Disallow: `/api/`, `/(dashboard)/`
- Sitemap URL reference

### JSON-LD (landing page only)

`SoftwareApplication` schema:

- name: Plexease
- applicationCategory: DeveloperApplication
- operatingSystem: Web
- offers: Free (GBP 0) + Pro (GBP 19)

### Apple touch icon

180x180 PNG at `public/apple-touch-icon.png`, generated from existing `icon.svg`. Auto-discovered by Next.js.

---

## 4. File Structure

### New files

```
app/
  terms/page.tsx
  privacy/page.tsx
  sitemap.ts
  robots.ts
components/
  landing/nav.tsx
  landing/footer.tsx
  landing/how-it-works.tsx
  landing/attribution.tsx
public/
  apple-touch-icon.png
```

### Modified files

- `app/page.tsx` — Use shared nav/footer, add How It Works + Attribution, add JSON-LD
- `app/layout.tsx` — Enhanced metadata
- `components/landing/pricing-section.tsx` — Add `id="pricing"` for footer anchor

### Unchanged

- `app/globals.css`
- `app/opengraph-image.tsx`
- `app/manifest.ts`
- All dashboard, auth, billing, brand components

---

## 5. Testing

- Existing 18 Playwright tests must still pass (no auth/dashboard changes)
- Manual verification: legal pages render, footer links work, OG preview, sitemap.xml valid

---

## 6. Future Considerations

### API usage monitoring (not in Phase 6)

Pro plan currently offers "unlimited" usage at GBP 19/month. Claude API costs roughly GBP 0.01-0.05 per query. At launch this is fine — no users yet and "unlimited" is a strong marketing message.

Action for Phase 7/8: add per-user API cost monitoring and alert thresholds. Adjust limits based on real usage data if needed. The infrastructure already exists (usage table, increment_usage RPC).

### Content marketing (not in Phase 6)

SEO-targeted blog posts (e.g. "best NuGet alternatives to X"), dev community posts (Reddit r/dotnet, Dev.to), product directory submissions (Product Hunt, SaaSHub). Address when ready for active user acquisition.

### Domain purchase

`plexease.io` and `plexease.dev` noted as to-do in PLEXEASE.md. Update `metadataBase` and canonical URLs when purchased.
