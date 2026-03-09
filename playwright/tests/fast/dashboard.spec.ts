import { test, expect } from "../../fixtures";
import { DashboardPage } from "../../pages/dashboard.page";

test.describe("Dashboard", () => {
  test("free user sees upgrade prompt, usage card, and tool links", async ({ freeUserPage }) => {
    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.upgradeLink).toBeVisible();
    await expect(dashboard.usageCard).toBeVisible();
  });

  test("pro user sees manage subscription and tool links", async ({ proUserPage }) => {
    const dashboard = new DashboardPage(proUserPage);
    await dashboard.goto();

    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.manageBillingButton).toBeVisible();
  });

  test("sidebar shows lifecycle categories", async ({ freeUserPage }) => {
    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.exploreCategory).toBeVisible();
    await expect(dashboard.setUpCategory).toBeVisible();
    await expect(dashboard.troubleshootCategory).toBeVisible();
    await expect(dashboard.maintainCategory).toBeVisible();
  });

  test("view toggle is visible in sidebar", async ({ freeUserPage }) => {
    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.businessButton).toBeVisible();
    await expect(dashboard.supportButton).toBeVisible();
    await expect(dashboard.implementerButton).toBeVisible();
  });
});
