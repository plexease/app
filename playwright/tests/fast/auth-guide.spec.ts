import { test, expect } from "../../fixtures";
import { AuthGuidePage } from "../../pages/auth-guide.page";

test.describe("Auth Guide", () => {
  test("free user submits service and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.authGuide(freeUserPage, "success");

    const guide = new AuthGuidePage(freeUserPage);
    await guide.goto();

    await guide.getGuide("Stripe");

    await expect(guide.authMethodSection).toBeVisible({ timeout: 5000 });
    await expect(guide.stepsSection).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.authGuide(freeUserPage, "success");

    const guide = new AuthGuidePage(freeUserPage);
    await guide.goto();

    await guide.getGuide("Stripe");

    await expect(guide.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("submit disabled without service", async ({ freeUserPage }) => {
    const guide = new AuthGuidePage(freeUserPage);
    await guide.goto();

    await expect(guide.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.authGuide(freeUserPage, "error");

    const guide = new AuthGuidePage(freeUserPage);
    await guide.goto();

    await guide.getGuide("Stripe");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.authGuide(proUserPage, "success");

    const guide = new AuthGuidePage(proUserPage);
    await guide.goto();

    await expect(guide.usageCounter).toBeVisible();
  });
});
