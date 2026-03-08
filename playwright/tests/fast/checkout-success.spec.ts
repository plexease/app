import { test, expect } from "../../fixtures";

test.describe("Checkout Success Page", () => {
  test("redirects to dashboard when plan is pro", async ({ freeUserPage, mockApi }) => {
    await mockApi.checkoutStatus(freeUserPage, { plan: "pro" });
    await freeUserPage.goto("/upgrade/success");

    await expect(freeUserPage).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("shows loading state when plan is not yet pro", async ({ freeUserPage, mockApi }) => {
    await mockApi.checkoutStatus(freeUserPage, { plan: "free" });
    await freeUserPage.goto("/upgrade/success");

    await expect(
      freeUserPage.getByRole("heading", { name: /setting up your pro account/i })
    ).toBeVisible();
    await expect(
      freeUserPage.locator(".animate-spin")
    ).toBeVisible();
  });
});
