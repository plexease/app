# Phase 7: Testing & CI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add GitHub Actions CI with fast/slow Playwright test split, route-level API mocking, and test user cleanup.

**Architecture:** Split existing 18 Playwright tests into fast (mocked, every push) and slow (real API, PR only) suites. Add `page.route()` intercepts for `/api/tools/nuget-advisor`. Single `ci.yml` with three jobs: test-fast, test-slow, cleanup. Build step separated from webServer in CI.

**Tech Stack:** Playwright, GitHub Actions, Playwright Docker container (`mcr.microsoft.com/playwright:v1.58.2-noble`)

---

### Task 1: Record canned API response fixtures

**Files:**
- Create: `playwright/mocks/fixtures/nuget-advisor-success.json`
- Create: `playwright/mocks/fixtures/nuget-advisor-error.json`

**Step 1: Run the NuGet Advisor locally and capture a real response**

Start the dev server (if not running), then use curl to hit the API as an authenticated user. Alternatively, use the Supabase service role to bypass auth and call the Claude API directly from `lib/claude.ts`. The simplest approach: read the existing test, run it once, and capture the response shape from the API route at `app/api/tools/nuget-advisor/route.ts`.

The success response is the return value of `getNuGetAdvice()` from `lib/claude.ts`. Read that file to understand the exact JSON shape, then create a realistic fixture.

**Step 2: Create the success fixture**

Create `playwright/mocks/fixtures/nuget-advisor-success.json` with the shape returned by the API route. It should match the Zod-validated output from `lib/claude.ts`. Example structure (adapt to actual schema):

```json
{
  "whatItDoes": "Newtonsoft.Json is a high-performance JSON framework for .NET...",
  "alternatives": "System.Text.Json (built-in since .NET Core 3.0)...",
  "compatibility": "Compatible with .NET Framework 4.5+ and .NET 6/7/8...",
  "versionAdvice": "Use 13.x for latest features. If on .NET Framework, 12.x is stable..."
}
```

Read `lib/claude.ts` to get the exact field names and types.

**Step 3: Create the error fixture**

Create `playwright/mocks/fixtures/nuget-advisor-error.json`:

```json
{
  "error": "Failed to get advice. Please try again."
}
```

This matches the 500 response shape from the API route (line 65-67 of `app/api/tools/nuget-advisor/route.ts`).

**Step 4: Commit**

```bash
git add playwright/mocks/fixtures/
git commit -m "test: add canned NuGet Advisor response fixtures for route intercepts"
```

---

### Task 2: Create the base tool page object

**Files:**
- Create: `playwright/pages/tool-page.base.ts`
- Modify: `playwright/pages/nuget-advisor.page.ts`

**Step 1: Create the base page object**

Create `playwright/pages/tool-page.base.ts`:

```ts
import type { Page, Locator } from "@playwright/test";

/**
 * Base page object for tool pages. Each tool extends this class.
 *
 * When adding a new tool in Phase 8+:
 * 1. Create a page object extending ToolPageBase
 * 2. Add a smoke test in playwright/tests/fast/
 */
export abstract class ToolPageBase {
  protected readonly main: Locator;

  constructor(protected page: Page) {
    this.main = page.locator("main");
  }

  abstract get heading(): Locator;
  abstract get formInput(): Locator;
  abstract get submitButton(): Locator;

  readonly usageCounter = this.main.getByText(/\d+ of 20 free lookups/);
  readonly limitReachedMessage = this.main.getByText("You've used all 20 free lookups");
  readonly upgradeButton = this.main.locator('a[href="/upgrade"]');

  abstract goto(): Promise<void>;
}
```

**Step 2: Refactor NuGetAdvisorPage to extend the base**

Modify `playwright/pages/nuget-advisor.page.ts`:

```ts
import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class NuGetAdvisorPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /nuget advisor/i });
  }

  get formInput(): Locator {
    return this.packageInput;
  }

  readonly packageInput = this.main.locator('input[id="package-name"]');
  readonly submitButton = this.main.locator('button[type="submit"]');
  readonly whatItDoesCard = this.main.getByText("What it does").locator("..");
  readonly alternativesCard = this.main.getByText("Alternatives").locator("..");
  readonly compatibilityCard = this.main.getByText("Compatibility").locator("..");
  readonly versionAdviceCard = this.main.getByText("Version advice").locator("..");

  async goto() {
    await this.page.goto("/tools/nuget-advisor");
  }

  async analysePackage(name: string) {
    await this.packageInput.fill(name);
    await this.submitButton.click();
  }
}
```

**Step 3: Run existing tests to verify refactor didn't break anything**

Run: `npm test`
Expected: All 18 tests still pass.

**Step 4: Commit**

```bash
git add playwright/pages/tool-page.base.ts playwright/pages/nuget-advisor.page.ts
git commit -m "refactor: extract ToolPageBase for reusable tool page objects"
```

---

### Task 3: Add mockApi fixture to test fixtures

**Files:**
- Modify: `playwright/fixtures/index.ts`

**Step 1: Add the mockApi fixture**

Add a new fixture to `playwright/fixtures/index.ts`. Add `mockApi` to the `TestFixtures` type:

```ts
mockApi: {
  nugetAdvisor: (scenario?: "success" | "error") => Promise<void>;
};
```

Add the fixture implementation inside `base.extend<TestFixtures>({...})`:

```ts
mockApi: async ({ page }, use) => {
  await use({
    nugetAdvisor: async (scenario: "success" | "error" = "success") => {
      const fixturePath = path.resolve(
        __dirname,
        `../mocks/fixtures/nuget-advisor-${scenario}.json`
      );
      const body = require(fixturePath);
      const status = scenario === "error" ? 500 : 200;

      await page.route("**/api/tools/nuget-advisor", (route) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(body),
        })
      );
    },
  });
},
```

Note: `mockApi` depends on `page`, but it will be used with `freeUserPage`/`proUserPage` fixtures. Since those fixtures create their own page, `mockApi` needs to accept a page parameter OR be restructured. The cleaner approach: make `mockApi` a factory that takes a `Page`:

```ts
type MockApiFactory = {
  nugetAdvisor: (page: Page, scenario?: "success" | "error") => Promise<void>;
};

// In the fixture:
mockApi: async ({}, use) => {
  await use({
    nugetAdvisor: async (page: Page, scenario: "success" | "error" = "success") => {
      const fixturePath = path.resolve(
        __dirname,
        `../mocks/fixtures/nuget-advisor-${scenario}.json`
      );
      const { readFileSync } = await import("fs");
      const body = readFileSync(fixturePath, "utf-8");
      const status = scenario === "error" ? 500 : 200;

      await page.route("**/api/tools/nuget-advisor", (route) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body,
        })
      );
    },
  });
},
```

Usage in tests:

```ts
test("mocked NuGet Advisor", async ({ freeUserPage, mockApi }) => {
  await mockApi.nugetAdvisor(freeUserPage, "success");
  // ...
});
```

**Step 2: Verify fixture compiles**

Run: `npx tsc --noEmit -p playwright/tsconfig.json` (or just run a test to see if it loads)

If there's no `tsconfig.json` in playwright, run: `npm test -- --project=fast` (after Task 5 creates the config). For now, just verify no syntax errors.

**Step 3: Commit**

```bash
git add playwright/fixtures/index.ts
git commit -m "feat: add mockApi fixture for Playwright route intercepts"
```

---

### Task 4: Update Playwright config with fast/slow projects

**Files:**
- Modify: `playwright/playwright.config.ts`

**Step 1: Rewrite the config**

Replace the entire content of `playwright/playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const isCI = !!process.env.CI;

export default defineConfig({
  fullyParallel: false,
  forbidOnly: isCI,
  retries: 1,
  reporter: isCI ? [["html", { open: "never" }], ["github"]] : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  webServer: {
    command: isCI ? "npm start" : "npm run dev",
    port: 3000,
    reuseExistingServer: !isCI,
    cwd: path.resolve(__dirname, ".."),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      NEXT_PUBLIC_STRIPE_PRICE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
      NEXT_PUBLIC_STRIPE_PRICE_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    },
  },
  projects: [
    {
      name: "fast",
      testDir: "./tests/fast",
      fullyParallel: true,
      workers: isCI ? 2 : 4,
    },
    {
      name: "slow",
      testDir: "./tests/slow",
      fullyParallel: false,
      workers: 1,
    },
  ],
});
```

**Step 2: Commit**

```bash
git add playwright/playwright.config.ts
git commit -m "feat: split Playwright config into fast/slow projects with CI-aware webServer"
```

---

### Task 5: Move existing tests into fast/slow directories

**Files:**
- Move: `playwright/tests/*.spec.ts` → `playwright/tests/fast/` and `playwright/tests/slow/`
- Create: `playwright/tests/fast/stripe-redirect.spec.ts`
- Create: `playwright/tests/slow/stripe-checkout.spec.ts` (trimmed)

**Step 1: Create directories**

```bash
mkdir -p playwright/tests/fast playwright/tests/slow
```

**Step 2: Move unmodified test files to fast/**

```bash
mv playwright/tests/auth.spec.ts playwright/tests/fast/
mv playwright/tests/dashboard.spec.ts playwright/tests/fast/
mv playwright/tests/protected-routes.spec.ts playwright/tests/fast/
mv playwright/tests/error-pages.spec.ts playwright/tests/fast/
```

These files need their import paths updated from `"../fixtures"` to `"../../fixtures"`:

In each moved file, change:
```ts
import { test, expect } from "../fixtures";
```
to:
```ts
import { test, expect } from "../../fixtures";
```

Also update any page object imports similarly:
- `"../pages/login.page"` → `"../../pages/login.page"`
- `"../pages/signup.page"` → `"../../pages/signup.page"`
- `"../pages/dashboard.page"` → `"../../pages/dashboard.page"`
- `"../pages/error.page"` → `"../../pages/error.page"`

**Step 3: Move nuget-advisor.spec.ts to fast/ and rewire to use mockApi**

Move: `playwright/tests/nuget-advisor.spec.ts` → `playwright/tests/fast/nuget-advisor.spec.ts`

Rewrite to use the mockApi fixture:

```ts
import { test, expect } from "../../fixtures";
import { NuGetAdvisorPage } from "../../pages/nuget-advisor.page";

test.describe("NuGet Advisor", () => {
  test("free user submits query and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.nugetAdvisor(freeUserPage, "success");

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.analysePackage("Newtonsoft.Json");

    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 5000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });

  test("pro user submits query without usage limit shown", async ({ proUserPage, mockApi }) => {
    await mockApi.nugetAdvisor(proUserPage, "success");

    const advisor = new NuGetAdvisorPage(proUserPage);
    await advisor.goto();

    await expect(advisor.usageCounter).not.toBeVisible();

    await advisor.analysePackage("Serilog");

    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 5000 });
  });
});
```

Note: timeout reduced from 30s to 5s since responses are now mocked.

**Step 4: Move usage-limits.spec.ts to fast/ and rewire to use mockApi**

Move: `playwright/tests/usage-limits.spec.ts` → `playwright/tests/fast/usage-limits.spec.ts`

Rewrite:

```ts
import { test, expect } from "../../fixtures";
import { NuGetAdvisorPage } from "../../pages/nuget-advisor.page";

test.describe("Usage Limits", () => {
  test("free user at limit 20 sees block message", async ({
    freeUserPage,
    supabaseAdmin,
  }) => {
    const userId = await supabaseAdmin.getFreeUserId();

    await supabaseAdmin.setUsageCount(userId, "nuget-advisor", 20);

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.limitReachedMessage).toBeVisible();
    await expect(advisor.upgradeButton).toBeVisible();

    await supabaseAdmin.resetUsage(userId);
  });

  test("free user at limit 19 can still submit", async ({
    freeUserPage,
    supabaseAdmin,
    mockApi,
  }) => {
    await mockApi.nugetAdvisor(freeUserPage, "success");
    const userId = await supabaseAdmin.getFreeUserId();

    await supabaseAdmin.setUsageCount(userId, "nuget-advisor", 19);

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.packageInput).toBeVisible();
    await expect(advisor.usageCounter).toBeVisible();

    await advisor.analysePackage("Moq");

    await expect(advisor.limitReachedMessage).toBeVisible({ timeout: 5000 });

    await supabaseAdmin.resetUsage(userId);
  });
});
```

Note: The "at limit 20" test doesn't need mockApi — it never submits. The "at limit 19" test does submit, so it uses mockApi. However, there's a subtlety: the mock intercepts the browser→server call, but the server still tries to check/increment usage in Supabase. Since we're intercepting at the route level, the server code **never executes** — the browser gets the mocked response directly. This means the usage increment doesn't happen, so the client-side "limit reached" state won't trigger from the server incrementing to 20.

**Important design decision:** For the "at limit 19" test, the mock prevents the real server-side flow. Two options:
- A) Keep this test in slow/ (hitting real API) — simplest, already works
- B) Mock the route to return both the result AND a usage header/field that triggers the client-side limit

Read the client-side component to understand how it detects hitting the limit after a successful submit, then decide the right approach. The test may need to stay in slow/ or the mock response needs to include whatever signal the client uses.

**Step 5: Split stripe-checkout.spec.ts**

Create `playwright/tests/fast/stripe-redirect.spec.ts` with just the redirect test:

```ts
import { test, expect } from "../../fixtures";
import { UpgradePage } from "../../pages/upgrade.page";

test.describe("Stripe Checkout", () => {
  test("free user checkout redirects to Stripe", async ({ freeUserPage }) => {
    const upgrade = new UpgradePage(freeUserPage);
    await upgrade.goto();
    await expect(upgrade.heading).toBeVisible();

    await upgrade.clickSubscribe();

    await freeUserPage.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });
    expect(freeUserPage.url()).toContain("checkout.stripe.com");
  });
});
```

Create `playwright/tests/slow/stripe-checkout.spec.ts` with the remaining two tests:

```ts
import { test, expect } from "../../fixtures";
import { UpgradePage } from "../../pages/upgrade.page";
import { DashboardPage } from "../../pages/dashboard.page";

test.describe("Stripe Checkout", () => {
  test("full checkout with test card", async ({ freeUserPage }) => {
    test.skip(!!process.env.CI, "Skipped in CI — Stripe hosted checkout DOM is fragile");
    test.setTimeout(60000);
    const upgrade = new UpgradePage(freeUserPage);
    await upgrade.goto();
    await upgrade.clickSubscribe();

    await freeUserPage.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });

    try {
      const emailField = freeUserPage.locator('input[name="email"]');
      if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailField.fill(process.env.TEST_FREE_USER_EMAIL!);
      }

      await freeUserPage.locator('#cardNumber, [name="cardNumber"], [name="number"]')
        .fill("4242424242424242", { timeout: 2000 });
      await freeUserPage.locator('#cardExpiry, [name="cardExpiry"], [name="expiry"]')
        .fill("12/30", { timeout: 2000 });
      await freeUserPage.locator('#cardCvc, [name="cardCvc"], [name="cvc"]')
        .fill("123", { timeout: 2000 });

      const nameField = freeUserPage.locator('[name="billingName"]');
      if (await nameField.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nameField.fill("Test User");
      }

      const zipField = freeUserPage.locator('[name="billingPostalCode"]');
      if (await zipField.isVisible({ timeout: 1000 }).catch(() => false)) {
        await zipField.fill("SW1A 1AA");
      }

      await freeUserPage.locator('button[type="submit"], .SubmitButton').click({ timeout: 2000 });

      await freeUserPage.waitForURL(/\/upgrade\/success/, { timeout: 30000 });
      console.log("Full Stripe checkout completed successfully.");
    } catch (error) {
      console.warn(
        "Soft assertion: Stripe checkout UI interaction failed (this is expected if Stripe changed their hosted checkout UI).",
        error instanceof Error ? error.message : error
      );
    }
  });

  test("pro user manage subscription button triggers portal redirect", async ({ proUserPage }) => {
    const dashboard = new DashboardPage(proUserPage);
    await dashboard.goto();

    await expect(dashboard.manageBillingButton).toBeVisible();

    try {
      await dashboard.manageBillingButton.click();

      await proUserPage.waitForURL(/billing\.stripe\.com/, { timeout: 15000 });
      console.log("Stripe billing portal redirect succeeded.");
    } catch (error) {
      console.warn(
        "Soft assertion: Stripe billing portal redirect failed (expected — test user has fake subscription ID).",
        error instanceof Error ? error.message : error
      );
    }
  });
});
```

**Step 6: Delete the original files**

```bash
rm playwright/tests/stripe-checkout.spec.ts
rm playwright/tests/nuget-advisor.spec.ts
rm playwright/tests/usage-limits.spec.ts
```

The other original files were already moved in Step 2.

**Step 7: Run fast tests to verify**

Run: `npx playwright test --project=fast`
Expected: All moved tests pass (mocked ones may fail until fixtures are wired — that's ok, verify the unmocked ones pass).

**Step 8: Commit**

```bash
git add playwright/tests/
git commit -m "refactor: split tests into fast/slow directories with mockApi for mocked suites"
```

---

### Task 6: Write validation tests

**Files:**
- Create: `playwright/tests/fast/landing-page.spec.ts`
- Create: `playwright/tests/fast/legal-pages.spec.ts`
- Create: `playwright/tests/fast/nuget-advisor-mocked.spec.ts`

**Step 1: Create landing page smoke test**

Create `playwright/tests/fast/landing-page.spec.ts`:

```ts
import { test, expect } from "../../fixtures";

test.describe("Landing Page", () => {
  test("renders hero section with CTA", async ({ anonPage }) => {
    await anonPage.goto("/");

    await expect(anonPage.getByText("Complex integrations,")).toBeVisible();
    await expect(anonPage.getByText("with ease")).toBeVisible();

    const cta = anonPage.getByRole("link", { name: /start for free/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/signup");
  });
});
```

**Step 2: Create legal pages test**

Create `playwright/tests/fast/legal-pages.spec.ts`:

```ts
import { test, expect } from "../../fixtures";

test.describe("Legal Pages", () => {
  test("Terms of Service page renders", async ({ anonPage }) => {
    await anonPage.goto("/terms");

    await expect(anonPage.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
    await expect(anonPage.getByText("Last updated: 7 March 2026")).toBeVisible();
  });

  test("Privacy Policy page renders", async ({ anonPage }) => {
    await anonPage.goto("/privacy");

    await expect(anonPage.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await expect(anonPage.getByText("Last updated: 7 March 2026")).toBeVisible();
  });
});
```

**Step 3: Create mocked NuGet Advisor test**

Create `playwright/tests/fast/nuget-advisor-mocked.spec.ts`:

```ts
import { test, expect } from "../../fixtures";
import { NuGetAdvisorPage } from "../../pages/nuget-advisor.page";

test.describe("NuGet Advisor (mocked)", () => {
  test("free user sees mocked result cards instantly", async ({ freeUserPage, mockApi }) => {
    await mockApi.nugetAdvisor(freeUserPage, "success");

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.analysePackage("Newtonsoft.Json");

    // Mocked response should appear near-instantly (no real API call)
    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 3000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });

  test("free user sees error state from mocked error", async ({ freeUserPage, mockApi }) => {
    await mockApi.nugetAdvisor(freeUserPage, "error");

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.analysePackage("BadPackage");

    // Should show error message from the mocked 500 response
    await expect(
      freeUserPage.getByText(/failed to get advice|please try again/i)
    ).toBeVisible({ timeout: 3000 });
  });
});
```

**Step 4: Run the new fast tests**

Run: `npx playwright test --project=fast`
Expected: All tests pass including the 3 new validation tests.

**Step 5: Commit**

```bash
git add playwright/tests/fast/landing-page.spec.ts playwright/tests/fast/legal-pages.spec.ts playwright/tests/fast/nuget-advisor-mocked.spec.ts
git commit -m "test: add validation tests for landing page, legal pages, and mocked NuGet Advisor"
```

---

### Task 7: Create the slow canary test

**Files:**
- Create: `playwright/tests/slow/nuget-advisor-canary.spec.ts`

**Step 1: Create the canary test**

Create `playwright/tests/slow/nuget-advisor-canary.spec.ts`:

```ts
import { test, expect } from "../../fixtures";
import { NuGetAdvisorPage } from "../../pages/nuget-advisor.page";

test.describe("NuGet Advisor Canary", () => {
  test("real Claude API call returns result cards", async ({ freeUserPage }) => {
    test.setTimeout(60000);

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.analysePackage("Newtonsoft.Json");

    // Real API call — may take up to 30s
    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 30000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });
});
```

**Step 2: Run the slow tests**

Run: `npx playwright test --project=slow`
Expected: Canary test passes (hits real Claude API).

**Step 3: Commit**

```bash
git add playwright/tests/slow/nuget-advisor-canary.spec.ts
git commit -m "test: add NuGet Advisor canary test for real Claude API validation"
```

---

### Task 8: Add cleanup to global teardown

**Files:**
- Create: `playwright/helpers/cleanup-users.ts`
- Modify: `playwright/global-teardown.ts`

**Step 1: Create the cleanup helper**

Create `playwright/helpers/cleanup-users.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export async function purgeStaleTestUsers(): Promise<number> {
  const url = process.env.TEST_SUPABASE_URL;
  const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.warn("Skipping test user cleanup — missing env vars");
    return 0;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Failed to list users for cleanup:", error.message);
    return 0;
  }

  const staleUsers = users.filter(
    (u) => u.email?.startsWith("test-signup-") && u.email?.endsWith("@test.plexease.io")
  );

  let deleted = 0;
  for (const user of staleUsers) {
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error(`Failed to delete ${user.email}:`, delError.message);
    } else {
      deleted++;
    }
  }

  return deleted;
}
```

**Step 2: Update global-teardown.ts**

Add the cleanup call at the end of `globalTeardown()`. Add import:

```ts
import { purgeStaleTestUsers } from "./helpers/cleanup-users";
```

Add before the final `console.log("Global teardown complete.")`:

```ts
// Purge accumulated test-signup users
const purged = await purgeStaleTestUsers();
if (purged > 0) {
  console.log(`Purged ${purged} stale test-signup user(s).`);
}
```

**Step 3: Verify teardown runs**

Run: `npm test`
Expected: Tests pass, teardown logs "Global teardown complete." (and possibly purge count).

**Step 4: Commit**

```bash
git add playwright/helpers/cleanup-users.ts playwright/global-teardown.ts
git commit -m "feat: add stale test user cleanup to global teardown"
```

---

### Task 9: Create the GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the workflow file**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
  TEST_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
  TEST_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
  TEST_FREE_USER_EMAIL: ${{ secrets.TEST_FREE_USER_EMAIL }}
  TEST_FREE_USER_PASSWORD: ${{ secrets.TEST_FREE_USER_PASSWORD }}
  TEST_PRO_USER_EMAIL: ${{ secrets.TEST_PRO_USER_EMAIL }}
  TEST_PRO_USER_PASSWORD: ${{ secrets.TEST_PRO_USER_PASSWORD }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
  NEXT_PUBLIC_STRIPE_PRICE_MONTHLY: ${{ secrets.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY }}
  NEXT_PUBLIC_STRIPE_PRICE_ANNUAL: ${{ secrets.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL }}
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

jobs:
  test-fast:
    name: Fast Tests
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.58.2-noble
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run fast tests
        run: npx playwright test --config playwright/playwright.config.ts --project=fast
        env:
          CI: true

      - name: Upload test report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: fast-test-report
          path: |
            playwright-report/
            test-results/
          retention-days: 7

  test-slow:
    name: Slow Tests
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.58.2-noble
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run slow tests
        run: npx playwright test --config playwright/playwright.config.ts --project=slow
        env:
          CI: true

      - name: Upload test report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: slow-test-report
          path: |
            playwright-report/
            test-results/
          retention-days: 7

  cleanup:
    name: Cleanup Test Users
    needs: [test-fast, test-slow]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Purge stale test users
        run: |
          node -e "
            const { purgeStaleTestUsers } = require('./playwright/helpers/cleanup-users.ts');
            purgeStaleTestUsers().then(n => console.log('Purged', n, 'users'));
          "
        env:
          TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          TEST_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
```

**Important note on cleanup job:** The `node -e` approach won't work directly with TypeScript. Use `npx tsx` instead:

```yaml
      - name: Purge stale test users
        run: npx tsx -e "import { purgeStaleTestUsers } from './playwright/helpers/cleanup-users'; purgeStaleTestUsers().then(n => console.log('Purged', n, 'users'))"
        env:
          TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          TEST_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
```

Check if `tsx` is already a devDependency. If not, use `npx tsx` (npx will fetch it). Alternatively, since `dotenv` is already used, you could write a small `playwright/scripts/cleanup.ts` script.

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat: add GitHub Actions CI workflow with fast/slow test jobs and cleanup"
```

---

### Task 10: Add GitHub repository secrets

**Files:** None (GitHub settings)

**Step 1: Add all required secrets to the GitHub repo**

Go to https://github.com/plexease/app/settings/secrets/actions (or use `gh secret set`).

Add each secret from the `.env.test` file:

```bash
# Read values from local .env.test
source playwright/.env.test

gh secret set TEST_SUPABASE_URL --body "$TEST_SUPABASE_URL"
gh secret set TEST_SUPABASE_ANON_KEY --body "$TEST_SUPABASE_ANON_KEY"
gh secret set TEST_SUPABASE_SERVICE_ROLE_KEY --body "$TEST_SUPABASE_SERVICE_ROLE_KEY"
gh secret set TEST_FREE_USER_EMAIL --body "$TEST_FREE_USER_EMAIL"
gh secret set TEST_FREE_USER_PASSWORD --body "$TEST_FREE_USER_PASSWORD"
gh secret set TEST_PRO_USER_EMAIL --body "$TEST_PRO_USER_EMAIL"
gh secret set TEST_PRO_USER_PASSWORD --body "$TEST_PRO_USER_PASSWORD"
gh secret set STRIPE_SECRET_KEY --body "$STRIPE_SECRET_KEY"
gh secret set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY --body "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
gh secret set NEXT_PUBLIC_STRIPE_PRICE_MONTHLY --body "$NEXT_PUBLIC_STRIPE_PRICE_MONTHLY"
gh secret set NEXT_PUBLIC_STRIPE_PRICE_ANNUAL --body "$NEXT_PUBLIC_STRIPE_PRICE_ANNUAL"
gh secret set ANTHROPIC_API_KEY --body "$ANTHROPIC_API_KEY"
```

**Step 2: Verify secrets are set**

```bash
gh secret list
```

Expected: All 12 secrets listed.

---

### Task 11: Run full test suite locally and verify

**Files:** None

**Step 1: Run fast tests**

```bash
npx playwright test --config playwright/playwright.config.ts --project=fast
```

Expected: All fast tests pass (existing moved tests + 3 new validation tests + mocked NuGet Advisor tests).

**Step 2: Run slow tests**

```bash
npx playwright test --config playwright/playwright.config.ts --project=slow
```

Expected: Canary test passes, Stripe tests pass (or soft-assert).

**Step 3: Run both projects**

```bash
npx playwright test --config playwright/playwright.config.ts
```

Expected: All tests from both projects pass.

**Step 4: If any tests fail, debug and fix before proceeding.**

---

### Task 12: Push to main and verify CI

**Files:** None

**Step 1: Push to GitHub**

```bash
git push origin main
```

**Step 2: Check CI run**

```bash
gh run watch
```

Or visit the Actions tab at https://github.com/plexease/app/actions

Expected:
- `test-fast` job runs and passes
- `test-slow` job is skipped (push to main, not a PR)
- `cleanup` job runs

**Step 3: If CI fails, check the artifact reports, debug, fix, and push again.**

---

### Task 13: Update PLEXEASE.md

**Files:**
- Modify: `PLEXEASE.md`

**Step 1: Update the Phase 7 checklist**

Mark the Phase 7 items as complete:

```markdown
### Phase 7 — Testing & CI (complete)
- [x] GitHub Actions CI: fast tests on push, slow tests on PR, cleanup job
- [x] Fast/slow test split with Playwright projects
- [x] Route intercept mocking for NuGet Advisor API
- [x] Base tool page object pattern for future tools
- [x] Validation tests: landing page, legal pages, mocked NuGet Advisor
- [x] Test user cleanup in teardown + CI
```

Add note about deferred items:

```markdown
- Deferred: wider test scope (Phase 7.5), staging environment (future), MSW migration (when second API added)
- PR workflow starts Phase 7.5 onward
```

**Step 2: Commit**

```bash
git add PLEXEASE.md
git commit -m "docs: update PLEXEASE.md — Phase 7 complete"
git push origin main
```
