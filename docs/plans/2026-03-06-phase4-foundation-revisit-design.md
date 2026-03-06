# Phase 4 — Foundation Revisit Design

> Thorough UX, accessibility, and security review of the existing foundation before proceeding to branding and launch phases.

---

## Context

Phases 0–3 built the foundation, first tool (NuGet Advisor), and monetisation layer. A comprehensive review surfaced UX gaps, missing navigation, accessibility issues, and security hardening opportunities. Phase 4 addresses all of these before moving to branding and marketing.

The password reset flow, error pages, and cookie consent banner already exist as full implementations from earlier work. This phase focuses on reviewing and improving them, plus fixing broader foundation issues.

---

## Approach

Work is grouped by feature area so each group produces a self-contained, reviewable commit:

1. Auth page UX
2. Error pages
3. Cookie consent
4. Security hardening

---

## Section 1: Auth Page UX

Scope: all 5 auth pages (login, signup, forgot-password, reset-password, check-email) and their form components (login-form, signup-form, forgot-password-form, reset-password-form, oauth-button).

### 1.1 Branded header on all auth pages
Add a clickable "Plexease" text/logo at the top of each auth page linking to `/`. Matches the landing page style and gives users a way home from any auth page.

### 1.2 "Back to login" link on reset-password page
Currently the only auth page with zero navigation links. Add a "Back to login" link consistent with the other auth pages.

### 1.3 Display auth callback errors on login page
Read the `?error=auth_failed` query parameter on the login page. Show a toast or inline message so users know why they were redirected back.

### 1.4 OAuth button error handling
Wrap `signInWithOAuth` in try/catch. Show a toast on failure instead of failing silently.

### 1.5 Add `autoComplete` attributes to all form inputs
- Email fields: `autoComplete="email"`
- Login password: `autoComplete="current-password"`
- Signup/reset password: `autoComplete="new-password"`

### 1.6 Sanitize Supabase error messages
Replace raw `error.message` with user-friendly text. Map known Supabase error codes to friendly messages (e.g. "Invalid login credentials" instead of exposing whether the email exists). Fall back to a generic "Something went wrong" for unknown errors. Prevents user enumeration.

### 1.7 Mobile-responsive landing page nav
The landing page nav bar is not responsive. Add a hamburger menu or vertically stacked layout for small screens.

### 1.8 Audit external links for `rel="noopener noreferrer"`
Sweep all components for `<a>` tags with `target="_blank"` and add proper rel attributes.

### 1.9 Verify consistent disabled state on submit buttons
Ensure all auth forms disable the submit button during loading and show a loading indicator consistently.

### 1.10 "Back to home" link on check-email page
Currently only links to login. Add a link to `/` so users can return to the landing page.

---

## Section 2: Error Pages

Scope: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`.

### 2.1 Add "Go home" link to `error.tsx`
Currently only has "Try again". Add a link to `/` as a fallback.

### 2.2 Add "Go home" link to `global-error.tsx`
Same issue, same fix.

### 2.3 Add `<head>` element to `global-error.tsx`
It renders a full `<html>` document but is missing `<head>` with charset, viewport meta, and title. Required since global-error replaces the root layout.

### 2.4 Show error message in dev mode
Display `error.message` on both `error.tsx` and `global-error.tsx` when `process.env.NODE_ENV === 'development'`. Hidden in production.

### 2.5 Consistent styling across all three error pages
Ensure they share the same layout pattern: centered card, same spacing, same text hierarchy.

### 2.6 Dual navigation links for authenticated context
Add both "Go to dashboard" and "Go home" links on error pages. Check auth state client-side to determine whether to show the dashboard link.

### 2.7 Log errors in `global-error.tsx`
Explicitly `console.error` the error object for production debugging via server logs.

---

## Section 3: Cookie Consent

Scope: `components/ui/cookie-consent.tsx`, `app/layout.tsx`.

### 3.1 Export `getCookieConsent()` utility
Make consent state accessible to other components so future analytics scripts can check consent before loading. Makes the banner functional rather than cosmetic.

### 3.2 Improve GDPR compliance text
Be more specific: mention essential cookies (auth/sessions), explain what analytics would do, link to `/privacy` (placeholder for Phase 6).

### 3.3 Add accessibility semantics
Add `role="dialog"`, `aria-label`, and ensure buttons are keyboard-reachable.

### 3.4 Keyboard focus management
Ensure focus moves to the banner when it appears, or at minimum that the buttons are easily reachable via Tab.

### 3.5 "Manage cookies" link
Add a link in the dashboard sidebar and/or page footer that re-opens the consent banner. GDPR requires users to be able to change consent after the initial choice.

### 3.6 Consent expiry
Store a timestamp alongside the consent value. Re-prompt after 12 months (GDPR recommended maximum).

### 3.7 Hide banner on privacy policy page
Don't show the consent banner on `/privacy` so users can read the policy unobstructed.

---

## Section 4: Security Hardening

Scope: various lib files, API routes, middleware, config.

### 4.1 Fix cookie security flag in dashboard layout
Change `process.env.NODE_ENV === "production"` to `process.env.VERCEL_ENV === "production"` to match the pattern in `lib/stripe.ts`.

### 4.2 Add `'use server'` directive to `lib/supabase/service.ts`
Explicitly prevents the service role key from being bundled into client-side code.

### 4.3 Add `/check-email` and `/reset-password` to middleware `authRoutes`
Authenticated users get redirected to dashboard instead of seeing auth pages.

### 4.4 Sanitize error logging in API routes
Audit `console.error` calls. Log `err.message` or `err instanceof Error ? err.message : "Unknown error"` instead of full error objects.

### 4.5 Add email validation guard in checkout route
Replace `user.email!` non-null assertion with an explicit check returning 400 if email is missing.

### 4.6 Update `.env.local.example`
Add missing `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY` and `NEXT_PUBLIC_STRIPE_PRICE_ANNUAL` entries.

### 4.7 Add security headers in `next.config.ts`
Add standard security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`

### 4.8 Audit and fix external link security
Ensure all `target="_blank"` links have `rel="noopener noreferrer"`. (Overlaps with 1.8 — perform the audit once, fix everywhere.)

### 4.9 Stricter CSRF check on checkout route
Reject requests without an `Origin` header instead of allowing them through. Modern browsers always send Origin on POST requests.
