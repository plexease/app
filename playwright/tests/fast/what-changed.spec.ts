import { test, expect } from "../../fixtures";
import { WhatChangedPage } from "../../pages/what-changed.page";

test.describe("What Changed?", () => {
  test("free user submits change and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.whatChanged(freeUserPage, "success");

    const page = new WhatChangedPage(freeUserPage);
    await page.goto();

    await page.analyseChange("Stripe deprecated API version 2024-12-18");

    await expect(page.affectedSection).toBeVisible({ timeout: 5000 });
    await expect(page.prioritySection).toBeVisible();
    await expect(page.migrationStepsSection).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.whatChanged(freeUserPage, "success");

    const page = new WhatChangedPage(freeUserPage);
    await page.goto();

    await page.analyseChange("Stripe deprecated API version 2024-12-18");

    await expect(page.affectedSection).toBeVisible({ timeout: 5000 });
    await expect(page.whatsNextSection).toBeVisible();
  });

  test("submit disabled without change description", async ({ freeUserPage }) => {
    const page = new WhatChangedPage(freeUserPage);
    await page.goto();

    await expect(page.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.whatChanged(freeUserPage, "error");

    const page = new WhatChangedPage(freeUserPage);
    await page.goto();

    await page.analyseChange("Stripe deprecated API version 2024-12-18");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.whatChanged(proUserPage, "success");

    const page = new WhatChangedPage(proUserPage);
    await page.goto();

    await expect(page.usageCounter).toBeVisible();
  });
});
