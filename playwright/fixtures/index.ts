import { test as base, type Page, type BrowserContext } from "@playwright/test";
import { readFileSync } from "fs";
import path from "path";
import {
  setUsageCount,
  resetUsageForUser,
  findTestUser,
  currentMonth,
  setSubscriptionState,
  deleteSubscription,
  deleteUserProfile,
  ensureUserProfile,
} from "../helpers/supabase-admin";

type MockApiFactory = {
  nugetAdvisor: (page: Page, scenario?: "success" | "error") => Promise<void>;
  howItWorks: (page: Page, scenario?: "success" | "error") => Promise<void>;
  integrationBlueprint: (page: Page, scenario?: "success" | "error") => Promise<void>;
  codeGenerator: (page: Page, scenario?: "success" | "error") => Promise<void>;
  compatibilityCheck: (page: Page, scenario?: "success" | "error") => Promise<void>;
  errorResolver: (page: Page, scenario?: "success" | "error") => Promise<void>;
  toolFinder: (page: Page, scenario?: "success" | "error") => Promise<void>;
  apiWrapperGenerator: (page: Page, scenario?: "success" | "error") => Promise<void>;
  unitTestGenerator: (page: Page, scenario?: "success" | "error") => Promise<void>;
  connectionHealthCheck: (page: Page, scenario?: "success" | "error") => Promise<void>;
  upgradeAssistant: (page: Page, scenario?: "success" | "error") => Promise<void>;
  checkoutStatus: (page: Page, response: { plan: string }) => Promise<void>;
  router: (page: Page, scenario?: "success" | "error" | "rate_limited") => Promise<void>;
};

type TestFixtures = {
  freeUserPage: Page;
  proUserPage: Page;
  anonPage: Page;
  freshAnonPage: Page;
  mockApi: MockApiFactory;
  supabaseAdmin: {
    setUsageCount: (userId: string, toolName: string, count: number) => Promise<void>;
    resetUsage: (userId: string) => Promise<void>;
    getFreeUserId: () => Promise<string>;
    getProUserId: () => Promise<string>;
    setSubscriptionState: (
      userId: string,
      overrides: {
        plan?: string;
        status?: string;
        cancelAtPeriodEnd?: boolean;
        currentPeriodEnd?: string;
        gracePeriodEnd?: string | null;
      }
    ) => Promise<void>;
    resetSubscription: (userId: string) => Promise<void>;
    deleteUserProfile: (userId: string) => Promise<void>;
    ensureUserProfile: (userId: string) => Promise<void>;
  };
};

async function hideDevOverlay(context: BrowserContext) {
  await context.addInitScript(() => {
    // Disable pointer events on Next.js dev overlay.
    // Note: CSS display:none doesn't work because it uses Shadow DOM.
    // We use pointer-events:none so it doesn't intercept clicks.
    // For buttons directly under the overlay, tests use evaluate() JS clicks.
    const style = document.createElement("style");
    style.textContent = "nextjs-portal { pointer-events: none !important; }";
    document.head.appendChild(style);
  });
}

async function dismissCookieConsent(context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-consent-at", Date.now().toString());
  });
}

export const test = base.extend<TestFixtures>({
  freeUserPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.resolve(__dirname, "../auth/free-user.json"),
    });
    await hideDevOverlay(context);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  proUserPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: path.resolve(__dirname, "../auth/pro-user.json"),
    });
    await hideDevOverlay(context);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  anonPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    await hideDevOverlay(context);
    await dismissCookieConsent(context);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  freshAnonPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    await hideDevOverlay(context);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  mockApi: async ({}, use) => {
    await use({
      nugetAdvisor: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/nuget-advisor-${scenario}.json`
        );
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
      howItWorks: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/how-it-works-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/how-it-works", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      integrationBlueprint: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/integration-blueprint-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/integration-blueprint", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      codeGenerator: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/code-generator-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/code-generator", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      compatibilityCheck: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/compatibility-check-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/compatibility-check", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      errorResolver: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/error-resolver-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/error-resolver", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      toolFinder: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/tool-finder-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/tool-finder", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      apiWrapperGenerator: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/api-wrapper-generator-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/api-wrapper-generator", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      unitTestGenerator: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/unit-test-generator-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/unit-test-generator", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      connectionHealthCheck: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/connection-health-check-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/connection-health-check", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      upgradeAssistant: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/upgrade-assistant-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/upgrade-assistant", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      checkoutStatus: async (page: Page, response: { plan: string }) => {
        await page.route("**/api/stripe/checkout/status", (route) =>
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(response),
          })
        );
      },
      router: async (page: Page, scenario: "success" | "error" | "rate_limited" = "success") => {
        await page.route("**/api/tools/router", (route) => {
          if (scenario === "rate_limited") {
            return route.fulfill({
              status: 429,
              contentType: "application/json",
              body: JSON.stringify({ error: "Daily routing limit reached", rateLimited: true }),
            });
          }
          if (scenario === "error") {
            return route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ error: "Routing failed" }),
            });
          }
          const fixturePath = path.resolve(__dirname, "../mocks/fixtures/router-success.json");
          const body = readFileSync(fixturePath, "utf-8");
          return route.fulfill({ status: 200, contentType: "application/json", body });
        });
      },
    });
  },

  supabaseAdmin: async ({}, use) => {
    const freeEmail = process.env.TEST_FREE_USER_EMAIL!;
    const proEmail = process.env.TEST_PRO_USER_EMAIL!;

    await use({
      setUsageCount: (userId: string, toolName: string, count: number) =>
        setUsageCount(userId, toolName, count, currentMonth()),
      resetUsage: (userId: string) => resetUsageForUser(userId),
      getFreeUserId: () => findTestUser(freeEmail),
      getProUserId: () => findTestUser(proEmail),
      setSubscriptionState: (
        userId: string,
        overrides: {
          status?: string;
          cancelAtPeriodEnd?: boolean;
          currentPeriodEnd?: string;
          gracePeriodEnd?: string | null;
        }
      ) => setSubscriptionState(userId, overrides),
      resetSubscription: (userId: string) => deleteSubscription(userId),
      deleteUserProfile: (userId: string) => deleteUserProfile(userId),
      ensureUserProfile: (userId: string) => ensureUserProfile(userId),
    });
  },
});

export { expect } from "@playwright/test";
