import { test, expect } from "../../fixtures";
import { ConnectionMapPage } from "../../pages/connection-map.page";

test.describe("Connection Map", () => {
  test("submits platforms and shows results", async ({ freeUserPage, mockApi }) => {
    await mockApi.connectionMap(freeUserPage, "success");

    const mapPage = new ConnectionMapPage(freeUserPage);
    await mapPage.goto();

    await mapPage.mapConnections("Shopify for online store, Stripe for payments, Xero for accounting");

    await expect(mapPage.connectionsSection).toBeVisible({ timeout: 5000 });
    await expect(mapPage.weakPointsSection).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.connectionMap(freeUserPage, "success");

    const mapPage = new ConnectionMapPage(freeUserPage);
    await mapPage.goto();

    await mapPage.mapConnections("Shopify for online store, Stripe for payments");

    await expect(mapPage.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("submit disabled without platforms", async ({ freeUserPage }) => {
    const mapPage = new ConnectionMapPage(freeUserPage);
    await mapPage.goto();

    await expect(mapPage.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.connectionMap(freeUserPage, "error");

    const mapPage = new ConnectionMapPage(freeUserPage);
    await mapPage.goto();

    await mapPage.mapConnections("Shopify for online store, Stripe for payments");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("usage counter is visible", async ({ proUserPage, mockApi }) => {
    await mockApi.connectionMap(proUserPage, "success");

    const mapPage = new ConnectionMapPage(proUserPage);
    await mapPage.goto();

    await expect(mapPage.usageCounter).toBeVisible();
  });
});
