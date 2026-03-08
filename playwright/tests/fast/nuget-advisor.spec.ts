import { test, expect } from "../../fixtures";

test.describe("NuGet Advisor", () => {
  test("redirects to Package Advisor with csharp language", async ({ freeUserPage }) => {
    await freeUserPage.goto("/tools/nuget-advisor");
    await freeUserPage.waitForURL("**/tools/package-advisor**");

    await expect(freeUserPage).toHaveURL(/\/tools\/package-advisor\?language=csharp/);
  });
});
