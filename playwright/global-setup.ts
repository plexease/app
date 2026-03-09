import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { ensureTestUser, ensureProSubscription, ensureUserProfile, resetUsageForUser } from "./helpers/supabase-admin";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

async function dismissCookieConsent(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-consent-at", Date.now().toString());
  });
}

async function setOnboardedCookie(context: import("@playwright/test").BrowserContext, userId: string) {
  await context.addCookies([{
    name: "plexease_onboarded",
    value: userId,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  }]);
}

async function globalSetup() {
  const freeEmail = process.env.TEST_FREE_USER_EMAIL!;
  const freePassword = process.env.TEST_FREE_USER_PASSWORD!;
  const proEmail = process.env.TEST_PRO_USER_EMAIL!;
  const proPassword = process.env.TEST_PRO_USER_PASSWORD!;

  // 1. Ensure test users exist in Supabase
  console.log("Creating test users...");
  const freeUserId = await ensureTestUser(freeEmail, freePassword);
  const proUserId = await ensureTestUser(proEmail, proPassword);

  // 2. Seed user profiles (must be before login — middleware redirects non-onboarded users)
  console.log("Seeding user profiles...");
  await ensureUserProfile(freeUserId);
  await ensureUserProfile(proUserId);

  // 3. Seed pro subscription
  console.log("Seeding pro subscription...");
  await ensureProSubscription(proUserId);

  // 4. Reset usage counts for clean state
  console.log("Resetting usage counts...");
  await resetUsageForUser(freeUserId);
  await resetUsageForUser(proUserId);

  // 5. Log in as each user and save storageState
  const browser = await chromium.launch();

  // Free user login
  console.log("Logging in as free user...");
  const freeContext = await browser.newContext();
  await setOnboardedCookie(freeContext, freeUserId);
  const freePage = await freeContext.newPage();
  await freePage.goto("http://localhost:3000/login");
  await dismissCookieConsent(freePage);
  await freePage.locator('input[id="email"]').fill(freeEmail);
  await freePage.locator('input[id="password"]').fill(freePassword);
  await freePage.locator('button[type="submit"]').click();
  await freePage.waitForURL("**/dashboard");
  await freeContext.storageState({ path: path.resolve(__dirname, "auth/free-user.json") });
  await freeContext.close();

  // Pro user login
  console.log("Logging in as pro user...");
  const proContext = await browser.newContext();
  await setOnboardedCookie(proContext, proUserId);
  const proPage = await proContext.newPage();
  await proPage.goto("http://localhost:3000/login");
  await dismissCookieConsent(proPage);
  await proPage.locator('input[id="email"]').fill(proEmail);
  await proPage.locator('input[id="password"]').fill(proPassword);
  await proPage.locator('button[type="submit"]').click();
  await proPage.waitForURL("**/dashboard");
  await proContext.storageState({ path: path.resolve(__dirname, "auth/pro-user.json") });
  await proContext.close();

  await browser.close();
  console.log("Global setup complete.");
}

export default globalSetup;
