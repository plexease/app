# Phase 1 Full Design — Supabase, Auth, Dashboard & Landing Page

## Summary

Build out the remaining Phase 1 foundation: Supabase integration, authentication, dashboard shell, and marketing landing page.

## Approach

Supabase client libraries + SSR (`@supabase/supabase-js` + `@supabase/ssr`). Custom auth forms with Tailwind. Middleware-based route protection.

## Environment

Single Supabase project (dev) for now. Staging + production environments added closer to launch.

## Routing & Page Structure

```
app/
├── page.tsx                              # Marketing landing page
├── (auth)/
│   ├── login/page.tsx                    # Login (email+password, Google OAuth)
│   └── signup/page.tsx                   # Sign up
├── (dashboard)/
│   ├── layout.tsx                        # Sidebar layout
│   ├── page.tsx                          # Dashboard home (welcome + recently used tools)
│   ├── tools/
│   │   ├── page.tsx                      # Tools list
│   │   └── nuget-advisor/page.tsx        # NuGet Advisor (chat-style)
│   ├── account/page.tsx                  # Profile, email/password
│   └── billing/page.tsx                  # Current plan, Stripe portal link
├── auth/callback/route.ts                # OAuth callback handler
├── api/
│   ├── stripe/                           # Webhooks & checkout (Phase 3)
│   └── tools/nuget-advisor/route.ts      # Claude API calls (Phase 2)
```

## User Journey

1. Visitor lands on marketing page (Hero + Features + Pricing + CTA)
2. Top nav: "Log in" (returning) + "Get started free" (new)
3. New user → /signup → email+password or Google → /auth/callback → /dashboard
4. Returning user → /login → /dashboard
5. Dashboard home: welcome + recently used tools
6. Sidebar nav: Dashboard, Tools (expandable with sub-items), Account, Billing
7. Tool usage: chat-style interface (layout toggle visible, only chat functional at launch)
8. Free limit reached (5/day): upgrade prompt inline, links to /billing
9. Account: update email/password
10. Billing: view plan, upgrade/cancel via Stripe customer portal

## Auth

- Email + password registration/login
- Google OAuth (configured in Supabase dashboard)
- Session managed via @supabase/ssr with middleware for token refresh
- middleware.ts protects all /dashboard/* routes → unauthenticated users redirect to /login

## Database

```sql
users           (id, email, created_at, stripe_customer_id)
subscriptions   (id, user_id, plan, status, stripe_subscription_id)
usage           (id, user_id, tool_name, date, count)
```

- users.id maps to auth.users.id
- Row created on sign up via database trigger
- RLS: users can only read/update their own rows
- subscriptions defaults to plan: 'free'
- usage tracks per-tool daily counts

## Supabase Client Setup

- lib/supabase/client.ts — browser client (anon key)
- lib/supabase/server.ts — server client (cookies for auth)
- lib/supabase/middleware.ts — session refresh in middleware

## Dashboard Layout

- Fixed sidebar on desktop, collapsible hamburger on mobile
- Plexease branding top-left
- Sidebar sections: Dashboard, Tools (expandable), Account, Billing
- User email + logout at bottom of sidebar
- Active page highlighted

## Marketing Landing Page

- Dark theme
- Sections: Hero, Features (3-4 cards), Pricing (Free vs Pro), Final CTA, Footer
- Top nav: logo + Log in + Get started free
- Footer: copyright, Terms, Privacy (placeholder pages)
- Responsive

## Tool UX

- Chat-style default: input at bottom, AI responses above
- Layout toggle visible for split panel and single panel (wired up later)

## Account & Billing

- Account: update email, update password
- Billing: view current plan, upgrade/cancel via Stripe customer portal link
