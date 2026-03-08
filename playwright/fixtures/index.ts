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
} from "../helpers/supabase-admin";

type MockApiFactory = {
  nugetAdvisor: (page: Page, scenario?: "success" | "error") => Promise<void>;
  codeExplainer: (page: Page, scenario?: "success" | "error") => Promise<void>;
  integrationPlanner: (page: Page, scenario?: "success" | "error") => Promise<void>;
  codeGenerator: (page: Page, scenario?: "success" | "error") => Promise<void>;
  dependencyAudit: (page: Page, scenario?: "success" | "error") => Promise<void>;
  errorExplainer: (page: Page, scenario?: "success" | "error") => Promise<void>;
  packageAdvisor: (page: Page, scenario?: "success" | "error") => Promise<void>;
  apiWrapperGenerator: (page: Page, scenario?: "success" | "error") => Promise<void>;
  unitTestGenerator: (page: Page, scenario?: "success" | "error") => Promise<void>;
  healthChecker: (page: Page, scenario?: "success" | "error") => Promise<void>;
  migrationAssistant: (page: Page, scenario?: "success" | "error") => Promise<void>;
  checkoutStatus: (page: Page, response: { plan: string }) => Promise<void>;
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
        status?: string;
        cancelAtPeriodEnd?: boolean;
        currentPeriodEnd?: string;
        gracePeriodEnd?: string | null;
      }
    ) => Promise<void>;
    resetSubscription: (userId: string) => Promise<void>;
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
      codeExplainer: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/code-explainer-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/code-explainer", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      integrationPlanner: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/integration-planner-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/integration-planner", (route) =>
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
      dependencyAudit: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/dependency-audit-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/dependency-audit", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      errorExplainer: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/error-explainer-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/error-explainer", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      packageAdvisor: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/package-advisor-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/package-advisor", (route) =>
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
      healthChecker: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/health-checker-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/health-checker", (route) =>
          route.fulfill({ status, contentType: "application/json", body })
        );
      },
      migrationAssistant: async (page: Page, scenario: "success" | "error" = "success") => {
        const fixturePath = path.resolve(
          __dirname,
          `../mocks/fixtures/migration-assistant-${scenario}.json`
        );
        const body = readFileSync(fixturePath, "utf-8");
        const status = scenario === "error" ? 500 : 200;

        await page.route("**/api/tools/migration-assistant", (route) =>
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
    });
  },
});

export { expect } from "@playwright/test";
