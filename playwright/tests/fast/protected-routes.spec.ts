import { test, expect } from "../../fixtures";

test.describe("Protected Routes", () => {
  const protectedPaths = ["/dashboard", "/tools/nuget-advisor", "/upgrade"];

  for (const path of protectedPaths) {
    test(`unauthenticated user visiting ${path} is redirected to login`, async ({ anonPage }) => {
      await anonPage.goto(path);
      await expect(anonPage).toHaveURL(/\/login/);
    });
  }

  test("pro user visiting /upgrade is redirected to dashboard", async ({ proUserPage }) => {
    await proUserPage.goto("/upgrade");
    await expect(proUserPage).toHaveURL(/\/dashboard/);
  });
});
