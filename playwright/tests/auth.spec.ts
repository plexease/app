import { test, expect } from "../fixtures";
import { LoginPage } from "../pages/login.page";
import { SignupPage } from "../pages/signup.page";

test.describe("Authentication", () => {
  test("signup page renders form correctly", async ({ anonPage }) => {
    // Note: Full signup→redirect is rate-limited by Supabase (429) since
    // global setup already calls signUp for test users. We verify the form UI instead.
    const signupPage = new SignupPage(anonPage);
    await signupPage.goto();

    await expect(signupPage.emailInput).toBeVisible();
    await expect(signupPage.passwordInput).toBeVisible();
    await expect(signupPage.submitButton).toBeVisible();
    await expect(signupPage.submitButton).toHaveText("Create account");
  });

  test("login redirects to dashboard", async ({ anonPage }) => {
    const loginPage = new LoginPage(anonPage);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_FREE_USER_EMAIL!,
      process.env.TEST_FREE_USER_PASSWORD!
    );

    await expect(anonPage).toHaveURL(/\/dashboard/);
  });

  test("logout redirects to login page", async ({ freeUserPage }) => {
    await freeUserPage.goto("/dashboard");

    // Intercept the Supabase logout API call so the session isn't revoked
    // server-side. signOut() defaults to scope:'global' which revokes ALL
    // sessions for the user, breaking the shared storageState for subsequent tests.
    // The test still verifies the full UI flow: click → local state cleared → redirect.
    await freeUserPage.route("**/auth/v1/logout*", (route) =>
      route.fulfill({ status: 204 })
    );

    // Use JS click to bypass Next.js dev overlay intercepting pointer events
    await freeUserPage.getByText("Sign out").evaluate((el: HTMLElement) => el.click());

    await expect(freeUserPage).toHaveURL(/\/login/);
  });

  test("forgot password shows confirmation", async ({ anonPage }) => {
    await anonPage.goto("/forgot-password");

    await anonPage.locator('input[id="email"]').fill("test@example.com");
    await anonPage.locator('button[type="submit"]').click();

    await expect(
      anonPage.getByText("Check your email for a password reset link")
    ).toBeVisible();
  });
});
