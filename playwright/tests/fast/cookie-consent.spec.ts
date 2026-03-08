import { test, expect } from "../../fixtures";

test.describe("Cookie Consent", () => {
  test("banner appears on first visit", async ({ freshAnonPage }) => {
    await freshAnonPage.goto("/");
    await expect(
      freshAnonPage.getByRole("dialog", { name: /cookie consent/i })
    ).toBeVisible();
  });

  test("banner is hidden on /privacy page", async ({ freshAnonPage }) => {
    await freshAnonPage.goto("/privacy");
    await expect(
      freshAnonPage.getByRole("dialog", { name: /cookie consent/i })
    ).not.toBeVisible();
  });

  test("accepting dismisses banner and persists on reload", async ({ freshAnonPage }) => {
    await freshAnonPage.goto("/");
    const banner = freshAnonPage.getByRole("dialog", { name: /cookie consent/i });
    await expect(banner).toBeVisible();

    await banner.getByRole("button", { name: "Accept" }).click();
    await expect(banner).not.toBeVisible();

    await freshAnonPage.reload();
    await expect(banner).not.toBeVisible();
  });

  test("rejecting dismisses banner and persists on reload", async ({ freshAnonPage }) => {
    await freshAnonPage.goto("/");
    const banner = freshAnonPage.getByRole("dialog", { name: /cookie consent/i });
    await expect(banner).toBeVisible();

    await banner.getByRole("button", { name: "Reject" }).click();
    await expect(banner).not.toBeVisible();

    await freshAnonPage.reload();
    await expect(banner).not.toBeVisible();
  });

  test("manage cookies resets consent and banner reappears", async ({ anonPage }) => {
    // anonPage has cookie consent pre-accepted
    await anonPage.goto("/");
    const banner = anonPage.getByRole("dialog", { name: /cookie consent/i });
    await expect(banner).not.toBeVisible();

    // Click "Manage cookies" in footer
    await anonPage.getByRole("button", { name: /manage cookies/i }).click();
    await expect(banner).toBeVisible();
  });
});
