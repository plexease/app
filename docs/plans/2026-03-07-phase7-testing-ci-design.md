# Phase 7 Design: Testing & CI

## Overview

Add GitHub Actions CI pipeline with a fast/slow Playwright test split, route-level API mocking, and test user cleanup. Phase 7 pushes to main (CI can't gate its own creation). PR workflow begins Phase 7.5 onward.

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Staging | Deferred to future phase | No users yet; CI is the gate for now |
| API mocking | Playwright `page.route()` intercepts | No new deps, simple, MSW deferred until second API integration |
| CI runner | Playwright official Docker container | Skips browser install, deterministic |
| Test split | Fast on every push, slow on PR only | Fast tests are mocked (~2 min), slow hit real APIs (~5 min) |
| Wider test scope | Deferred to Phase 7.5 | Keep Phase 7 focused on infrastructure |
| Test user cleanup | Global teardown (local) + CI job (safety net) | Both cover local and CI paths |
| PR workflow | Starts Phase 7.5 onward | Phase 7 itself pushes to main like previous phases |

---

## Section 1: Playwright Route Intercepts

### What

Intercept the app's own API route `/api/tools/nuget-advisor` at the browser level using Playwright's `page.route()`. Return canned JSON responses from fixture files.

### Structure

```
playwright/
  mocks/
    fixtures/
      nuget-advisor-success.json   -- recorded from a real Claude API response
      nuget-advisor-error.json     -- simulated API error response
```

### Fixture in `playwright/fixtures/index.ts`

Add a `mockApi` fixture that accepts a scenario parameter:

```ts
mockApi.nugetAdvisor("success");  // default
mockApi.nugetAdvisor("error");    // error state
```

The fixture calls `page.route('**/api/tools/nuget-advisor', ...)` and fulfills with the corresponding JSON file.

### Why not MSW?

MSW can't easily intercept inside the Next.js child process spawned by Playwright's `webServer`. Playwright route intercepts are simpler and sufficient for one API integration. When a second API integration is added, migrate to MSW (see memory note).

### No production code changes required.

---

## Section 2: Test Suite Split

### Directory structure

```
playwright/
  tests/
    fast/
      auth.spec.ts
      dashboard.spec.ts
      protected-routes.spec.ts
      error-pages.spec.ts
      nuget-advisor.spec.ts         -- uses mockApi fixture
      usage-limits.spec.ts          -- uses mockApi fixture
      stripe-redirect.spec.ts       -- redirect-only test (no Stripe DOM)
      landing-page.spec.ts          -- validation test (new)
      legal-pages.spec.ts           -- validation test (new)
      nuget-advisor-mocked.spec.ts  -- validation test (new)
    slow/
      nuget-advisor-canary.spec.ts  -- 1 test, real Claude API
      stripe-checkout.spec.ts       -- full checkout + portal (existing, skip-ci on full checkout)
```

### What moves where

| Current file | Destination | Notes |
|-------------|-------------|-------|
| auth.spec.ts | fast/ | No API calls |
| dashboard.spec.ts | fast/ | No API calls |
| protected-routes.spec.ts | fast/ | No API calls |
| error-pages.spec.ts | fast/ | No API calls |
| nuget-advisor.spec.ts | fast/ | Rewire to use mockApi fixture |
| usage-limits.spec.ts | fast/ | Rewire to use mockApi fixture |
| stripe-checkout.spec.ts | Split | Redirect test to fast/, full checkout + portal to slow/ |

### New files

- `slow/nuget-advisor-canary.spec.ts` — minimal 1-test canary, submits real query, asserts result cards. Confirms Claude integration is live.
- `fast/landing-page.spec.ts` — hero heading, CTA link to /signup (validation test)
- `fast/legal-pages.spec.ts` — /terms and /privacy render with headings (validation test)
- `fast/nuget-advisor-mocked.spec.ts` — free user submits via mockApi, asserts result cards appear instantly (validates intercept works end-to-end)

---

## Section 3: GitHub Actions CI Workflow

### File: `.github/workflows/ci.yml`

### Trigger

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

### Jobs

#### 1. `test-fast` (every push and PR)

- Container: `mcr.microsoft.com/playwright:v1.58.2-noble`
- Steps:
  1. Checkout
  2. `npm ci`
  3. `npm run build` (separate step, not in webServer)
  4. `npx playwright test --project=fast`
- Secrets injected via `env:` block
- On failure: upload `playwright-report/` and `test-results/` (screenshots, traces) as artifacts

#### 2. `test-slow` (PR only)

- Same container and setup
- Condition: `if: github.event_name == 'pull_request'`
- Steps: same as fast but `npx playwright test --project=slow`
- On failure: upload artifacts

#### 3. `cleanup` (always, after both jobs)

- Condition: `needs: [test-fast, test-slow]`, `if: always()`
- Lightweight Node step (no Playwright container needed)
- Purges `test-signup-*@test.plexease.io` users from Supabase test project
- Only needs TEST_SUPABASE_URL + TEST_SUPABASE_SERVICE_ROLE_KEY

### Secrets

All injected via GitHub Actions `env:` block from repository secrets:

- TEST_SUPABASE_URL
- TEST_SUPABASE_ANON_KEY
- TEST_SUPABASE_SERVICE_ROLE_KEY
- TEST_FREE_USER_EMAIL, TEST_FREE_USER_PASSWORD
- TEST_PRO_USER_EMAIL, TEST_PRO_USER_PASSWORD
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- NEXT_PUBLIC_STRIPE_PRICE_MONTHLY, NEXT_PUBLIC_STRIPE_PRICE_ANNUAL
- ANTHROPIC_API_KEY

---

## Section 4: Playwright Config Changes

### Two projects

```ts
projects: [
  {
    name: "fast",
    testDir: "./tests/fast",
    fullyParallel: true,
    workers: process.env.CI ? 2 : 4,
  },
  {
    name: "slow",
    testDir: "./tests/slow",
    fullyParallel: false,
    workers: 1,
  },
],
```

### CI-aware webServer

- Local: `npm run dev` with `reuseExistingServer: true` (as today)
- CI: `npm start` (build happens as a separate CI step before Playwright)

```ts
webServer: {
  command: process.env.CI ? "npm start" : "npm run dev",
  port: 3000,
  reuseExistingServer: !process.env.CI,
  // ... env vars unchanged
},
```

### Artifact-friendly settings

```ts
use: {
  trace: "on-first-retry",
  screenshot: "only-on-failure",
  video: "off",
},
```

CI uploads `playwright-report/` and `test-results/` directories as artifacts on failure.

### Global teardown update

Add stale test user cleanup to `global-teardown.ts` — purge users matching `test-signup-*@test.plexease.io` pattern via Supabase admin API. This is the local counterpart to the CI cleanup job.

### Notes

- `hideDevOverlay` fixture is harmless in CI (production mode has no dev overlay). No change needed.
- Phase 7.5 will need a `freshAnonPage` fixture that does NOT auto-dismiss cookie consent, for testing the cookie consent banner.

---

## Section 5: Validation Tests

### Purpose

2-3 "freebie" fast tests to validate the mocked test infrastructure works, plus a base page object pattern for future tools.

### Tests

1. **Landing page smoke** (`fast/landing-page.spec.ts`)
   - Navigate to `/`
   - Assert hero heading "Complex integrations, with ease" visible
   - Assert "Start for free" CTA links to `/signup`

2. **Legal pages render** (`fast/legal-pages.spec.ts`)
   - Navigate to `/terms`, assert heading visible
   - Navigate to `/privacy`, assert heading visible

3. **Mocked NuGet Advisor** (`fast/nuget-advisor-mocked.spec.ts`)
   - Free user submits "Newtonsoft.Json" via `mockApi.nugetAdvisor("success")`
   - Assert all 4 result cards appear instantly
   - Validates the route intercept infrastructure works end-to-end

### Base tool page object

Create `playwright/pages/tool-page.base.ts` with common selectors shared across all tool pages:

```ts
// Common selectors for any tool page:
// - heading
// - form input + submit button
// - result cards container
// - usage counter (free users)
// - limit reached message + upgrade button
//
// Each tool extends this base. When adding a new tool in Phase 8+,
// create a page object extending ToolPageBase and a smoke test in fast/.
```

NuGetAdvisorPage extends this base. Pattern documented so future tools get a smoke test by default.

---

## Out of Scope (deferred)

| Item | Deferred to |
|------|-------------|
| ~55-60 new tests (full coverage backlog) | Phase 7.5 |
| `freshAnonPage` fixture for cookie consent tests | Phase 7.5 |
| Staging environment + env separation | Future phase |
| MSW migration | When second API integration is added |
| PR-based workflow | Phase 7.5 onward |

---

## File Changes Summary

### New files
- `.github/workflows/ci.yml`
- `playwright/tests/fast/landing-page.spec.ts`
- `playwright/tests/fast/legal-pages.spec.ts`
- `playwright/tests/fast/nuget-advisor-mocked.spec.ts`
- `playwright/tests/fast/stripe-redirect.spec.ts`
- `playwright/tests/slow/nuget-advisor-canary.spec.ts`
- `playwright/mocks/fixtures/nuget-advisor-success.json`
- `playwright/mocks/fixtures/nuget-advisor-error.json`
- `playwright/pages/tool-page.base.ts`
- `playwright/helpers/cleanup-users.ts`

### Moved files (to fast/)
- `auth.spec.ts`
- `dashboard.spec.ts`
- `protected-routes.spec.ts`
- `error-pages.spec.ts`
- `nuget-advisor.spec.ts` (rewired to use mockApi)
- `usage-limits.spec.ts` (rewired to use mockApi)

### Modified files
- `playwright/playwright.config.ts` (projects, CI-aware webServer, parallel config)
- `playwright/fixtures/index.ts` (add mockApi fixture)
- `playwright/global-teardown.ts` (add user cleanup)
- `playwright/tests/slow/stripe-checkout.spec.ts` (remove redirect test, keep full checkout + portal)
