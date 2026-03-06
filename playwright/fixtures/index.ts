import { test as base, type Page, type BrowserContext } from "@playwright/test";
import path from "path";
import {
  setUsageCount,
  resetUsageForUser,
  ensureTestUser,
  currentMonth,
} from "../helpers/supabase-admin";

type TestFixtures = {
  freeUserPage: Page;
  proUserPage: Page;
  anonPage: Page;
  supabaseAdmin: {
    setUsageCount: (userId: string, toolName: string, count: number) => Promise<void>;
    resetUsage: (userId: string) => Promise<void>;
    getFreeUserId: () => Promise<string>;
    getProUserId: () => Promise<string>;
  };
};

async function hideDevOverlay(context: BrowserContext) {
  await context.addInitScript(() => {
    // Hide the Next.js dev tools overlay that intercepts pointer events
    const style = document.createElement("style");
    style.textContent = "nextjs-portal { display: none !important; pointer-events: none !important; }";
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
