import { test, expect } from "../../fixtures";

test.describe("Legal Pages", () => {
  test("Terms of Service page renders", async ({ anonPage }) => {
    await anonPage.goto("/terms");

    await expect(anonPage.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
    await expect(anonPage.getByText("Last updated: 7 March 2026")).toBeVisible();
  });

  test("Privacy Policy page renders", async ({ anonPage }) => {
    await anonPage.goto("/privacy");

    await expect(anonPage.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await expect(anonPage.getByText("Last updated: 7 March 2026")).toBeVisible();
  });
});
