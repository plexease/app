import { test, expect } from "../../fixtures";

test.describe("Auth Pages", () => {
  test("check-email page renders", async ({ anonPage }) => {
    await anonPage.goto("/check-email");

    await expect(
      anonPage.getByRole("heading", { name: /check your email/i })
    ).toBeVisible();
    await expect(
      anonPage.getByRole("link", { name: /back to sign in/i })
    ).toHaveAttribute("href", "/login");
  });

  test("forgot-password page renders form", async ({ anonPage }) => {
    await anonPage.goto("/forgot-password");

    await expect(
      anonPage.getByRole("heading", { name: /reset your password/i })
    ).toBeVisible();
    await expect(anonPage.locator("input#email")).toBeVisible();
    await expect(
      anonPage.getByRole("button", { name: /send reset link/i })
    ).toBeVisible();
    await expect(
      anonPage.getByRole("link", { name: /sign in/i })
    ).toHaveAttribute("href", "/login");
  });

  test("forgot-password shows validation on empty submit", async ({ anonPage }) => {
    await anonPage.goto("/forgot-password");

    // HTML5 required attribute prevents submission — input should show :invalid
    const emailInput = anonPage.locator("input#email");
    const submitButton = anonPage.getByRole("button", { name: /send reset link/i });
    await submitButton.click();

    // Verify the input is invalid via HTML5 validation
    const isInvalid = await emailInput.evaluate(
      (el) => !(el as HTMLInputElement).checkValidity()
    );
    expect(isInvalid).toBe(true);
  });

  test("reset-password page renders form", async ({ anonPage }) => {
    await anonPage.goto("/reset-password");

    // Page renders even without a valid token — heading + form should be visible
    await expect(
      anonPage.getByRole("heading", { name: /set new password/i })
    ).toBeVisible();
    await expect(anonPage.locator("input#password")).toBeVisible();
    await expect(anonPage.locator("input#confirmPassword")).toBeVisible();
    await expect(
      anonPage.getByRole("button", { name: /update password/i })
    ).toBeVisible();
  });
});
