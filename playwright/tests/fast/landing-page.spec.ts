import { test, expect } from "../../fixtures";

test.describe("Landing Page", () => {
  test("renders hero section with CTA", async ({ anonPage }) => {
    await anonPage.goto("/");

    await expect(
      anonPage.getByRole("heading", { name: /complex integrations/i })
    ).toBeVisible();

    const cta = anonPage.getByRole("link", { name: /start for free/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/signup");
  });
});
