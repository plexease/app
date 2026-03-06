import { test, expect } from "../fixtures";
import { LoginPage } from "../pages/login.page";
import { SignupPage } from "../pages/signup.page";

test.describe("Authentication", () => {
  test("signup redirects to check-email page", async ({ anonPage }) => {
    const signupPage = new SignupPage(anonPage);
    await signupPage.goto();

    // Use a unique email to avoid conflicts
    const uniqueEmail = `test-signup-${Date.now()}@test.plexease.io`;
    await signupPage.signup(uniqueEmail, "TestSignup123!");

    await expect(anonPage).toHaveURL(/\/check-email/);
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
    await freeUserPage.getByText("Sign out").click();

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
