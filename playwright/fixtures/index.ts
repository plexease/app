import { test as base, type Page, type BrowserContext } from "@playwright/test";
import { readFileSync } from "fs";
import path from "path";
import {
  setUsageCount,
  resetUsageForUser,
  ensureTestUser,
  currentMonth,
} from "../helpers/supabase-admin";

type MockApiFactory = {
  nugetAdvisor: (page: Page, scenario?: "success" | "error") => Promise<void>;
};

type TestFixtures = {
  freeUserPage: Page;
  proUserPage: Page;
  anonPage: Page;
  mockApi: MockApiFactory;
  supabaseAdmin: {
    setUsageCount: (userId: string, toolName: string, count: number) => Promise<void>;
    resetUsage: (userId: string) => Promise<void>;
    getFreeUserId: () => Promise<string>;
    getProUserId: () => Promise<string>;
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
    });
  },

  supabaseAdmin: async ({}, use) => {
    const freeEmail = process.env.TEST_FREE_USER_EMAIL!;
    const freePassword = process.env.TEST_FREE_USER_PASSWORD!;
    const proEmail = process.env.TEST_PRO_USER_EMAIL!;
    const proPassword = process.env.TEST_PRO_USER_PASSWORD!;

    await use({
      setUsageCount: (userId: string, toolName: string, count: number) =>
        setUsageCount(userId, toolName, count, currentMonth()),
      resetUsage: (userId: string) => resetUsageForUser(userId),
      getFreeUserId: () => ensureTestUser(freeEmail, freePassword),
      getProUserId: () => ensureTestUser(proEmail, proPassword),
    });
  },
});

export { expect } from "@playwright/test";
