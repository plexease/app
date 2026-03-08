import { test, expect } from "../../fixtures";
import { LandingPage } from "../../pages/landing.page";

test.describe("Landing Page Sections", () => {
  let landing: LandingPage;

  test.beforeEach(async ({ anonPage }) => {
    landing = new LandingPage(anonPage);
    await landing.goto();
  });

  test("nav sign-in link points to /login", async () => {
    await expect(landing.signInLink).toHaveAttribute("href", "/login");
  });

  test("nav get-started link points to /signup", async () => {
    await expect(landing.getStartedNavLink).toHaveAttribute("href", "/signup");
  });

  test("nav logo links to home", async () => {
    await expect(landing.logoLink).toHaveAttribute("href", "/");
  });

  test("How It Works shows 3 steps", async () => {
    await expect(landing.howItWorksHeading).toBeVisible();
    await expect(landing.howItWorksSteps).toHaveCount(3);
  });

  test("Tools section shows NuGet Package Advisor card", async () => {
    await expect(landing.toolsHeading).toBeVisible();
    await expect(landing.nugetCard).toBeVisible();
  });

  test("Pricing shows Free and Pro cards", async () => {
    await expect(landing.pricingHeading).toBeVisible();
    await expect(landing.freeCardHeading).toBeVisible();
    await expect(landing.proCardHeading).toBeVisible();
  });

  test("Pricing toggle switches to annual", async ({ anonPage }) => {
    await expect(landing.proCardPrice).toContainText("19/mo");
    await landing.pricingToggle.click();
    await expect(landing.proCardPrice).toContainText("190/yr");
    await expect(anonPage.getByText(/save.*38/i)).toBeVisible();
  });

  test("Attribution section visible", async () => {
    await expect(landing.attributionText).toBeVisible();
  });

  test("Footer has three column headings", async () => {
    await expect(landing.footerProductHeading).toBeVisible();
    await expect(landing.footerLegalHeading).toBeVisible();
  });

  test("Footer legal links point to correct pages", async () => {
    await expect(landing.footerTermsLink).toHaveAttribute("href", "/terms");
    await expect(landing.footerPrivacyLink).toHaveAttribute("href", "/privacy");
  });
});
