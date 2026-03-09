import { test, expect } from "../../fixtures";
import { DashboardPage } from "../../pages/dashboard.page";

test.describe("Persona Views", () => {
  test("business owner view shows hero input", async ({ freeUserPage }) => {
    await freeUserPage.context().addCookies([{
      name: "viewing_as",
      value: "business_owner",
      domain: "localhost",
      path: "/",
    }]);

    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.heroInput).toBeVisible();
  });

  test("support ops view shows category cards", async ({ freeUserPage }) => {
    await freeUserPage.context().addCookies([{
      name: "viewing_as",
      value: "support_ops",
      domain: "localhost",
      path: "/",
    }]);

    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    // Should show category groups, not hero input
    await expect(dashboard.heroInput).not.toBeVisible();
    await expect(freeUserPage.getByText("Explore").first()).toBeVisible();
  });

  test("implementer view shows dense tool grid", async ({ freeUserPage }) => {
    await freeUserPage.context().addCookies([{
      name: "viewing_as",
      value: "implementer",
      domain: "localhost",
      path: "/",
    }]);

    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.allToolsHeading).toBeVisible();
    await expect(dashboard.heroInput).not.toBeVisible();
  });

  test("view toggle switches dashboard content", async ({ freeUserPage }) => {
    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    // Test user defaults to implementer persona — switch to business owner
    await dashboard.businessButton.click();

    // Wait for page refresh — hero input should appear
    await expect(dashboard.heroInput).toBeVisible({ timeout: 5000 });
  });

  test("router endpoint responds with valid tool (mocked)", async ({ freeUserPage, mockApi }) => {
    await mockApi.router(freeUserPage);
    await freeUserPage.goto("/dashboard");

    const response = await freeUserPage.evaluate(async () => {
      const res = await fetch("/api/tools/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "my orders are broken" }),
      });
      return res.json();
    });

    expect(response.tool).toBe("error-explainer");
  });

  test("router returns rate limited response", async ({ freeUserPage, mockApi }) => {
    await mockApi.router(freeUserPage, "rate_limited");
    await freeUserPage.goto("/dashboard");

    const response = await freeUserPage.evaluate(async () => {
      const res = await fetch("/api/tools/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test query" }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(429);
    expect(response.body.rateLimited).toBe(true);
  });
});
