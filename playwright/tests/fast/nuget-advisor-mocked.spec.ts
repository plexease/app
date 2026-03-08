import { test, expect } from "../../fixtures";

test.describe("NuGet Advisor (mocked)", () => {
  test("navigating to NuGet Advisor redirects to Package Advisor", async ({ freeUserPage }) => {
    await freeUserPage.goto("/tools/nuget-advisor");
    await freeUserPage.waitForURL("**/tools/package-advisor**");

    await expect(freeUserPage).toHaveURL(/\/tools\/package-advisor\?language=csharp/);
  });
});
