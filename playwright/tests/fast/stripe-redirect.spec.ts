import { test, expect } from "../../fixtures";
import { UpgradePage } from "../../pages/upgrade.page";

test.describe("Stripe Checkout", () => {
  test("free user checkout redirects to Stripe", async ({ freeUserPage }) => {
    const upgrade = new UpgradePage(freeUserPage);
    await upgrade.goto();
    await expect(upgrade.heading).toBeVisible();

    await upgrade.clickSubscribe();

    await freeUserPage.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });
    expect(freeUserPage.url()).toContain("checkout.stripe.com");
  });
});
