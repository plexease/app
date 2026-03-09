import { test, expect } from "../../fixtures";
import { UpgradePage } from "../../pages/upgrade.page";

test.describe("Upgrade Page", () => {
  let upgrade: UpgradePage;

  test.beforeEach(async ({ freeUserPage }) => {
    upgrade = new UpgradePage(freeUserPage);
    await upgrade.goto();
  });

  test("heading is visible", async () => {
    await expect(upgrade.heading).toBeVisible();
  });

  test("monthly pricing shown by default", async ({ freeUserPage }) => {
    await expect(freeUserPage.getByText(/19\/mo/)).toBeVisible();
  });

  test("toggle to annual shows annual price and save text", async ({ freeUserPage }) => {
    await freeUserPage.getByRole("switch").click();
    await expect(freeUserPage.getByText(/190\/yr/)).toBeVisible();
    await expect(freeUserPage.getByText(/save £38/i)).toBeVisible();
  });

  test("subscribe button is visible", async () => {
    await expect(upgrade.subscribeButton).toBeVisible();
  });

  test("feature comparison table is visible", async ({ freeUserPage }) => {
    await expect(freeUserPage.getByText("Feature")).toBeVisible();
    await expect(freeUserPage.getByText("1000/month").first()).toBeVisible();
  });
});
