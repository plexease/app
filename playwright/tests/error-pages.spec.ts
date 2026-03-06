import { test, expect } from "../fixtures";
import { ErrorPage } from "../pages/error.page";

test.describe("Error Pages", () => {
  test("visiting non-existent page shows 404 with navigation links", async ({ anonPage }) => {
    await anonPage.goto("/this-page-does-not-exist");

    const errorPage = new ErrorPage(anonPage);
    await expect(errorPage.heading404).toBeVisible();
    await expect(errorPage.message).toBeVisible();
    await expect(errorPage.dashboardLink).toBeVisible();
    await expect(errorPage.homeLink).toBeVisible();
  });
});
