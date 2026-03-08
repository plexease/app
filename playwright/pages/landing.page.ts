import type { Page, Locator } from "@playwright/test";

export class LandingPage {
  constructor(private page: Page) {}

  // Nav
  get nav(): Locator {
    return this.page.locator("nav");
  }
  get signInLink(): Locator {
    return this.nav.getByRole("link", { name: /sign in/i });
  }
  get getStartedNavLink(): Locator {
    return this.nav.getByRole("link", { name: /get started/i });
  }
  get logoLink(): Locator {
    return this.nav.getByRole("link", { name: /plexease home/i });
  }

  // How It Works
  get howItWorksHeading(): Locator {
    return this.page.getByRole("heading", { name: /how it works/i });
  }
  get howItWorksSteps(): Locator {
    return this.page
      .locator("section", { has: this.howItWorksHeading })
      .locator(".rounded-xl");
  }

  // Tools
  get toolsHeading(): Locator {
    return this.page.getByRole("heading", { name: "Tools", exact: true });
  }
  get nugetCard(): Locator {
    return this.page.locator("h3", { hasText: "NuGet Package Advisor" });
  }

  // Pricing
  get pricingHeading(): Locator {
    return this.page.getByRole("heading", { name: "Pricing", exact: true });
  }
  get pricingToggle(): Locator {
    return this.page.getByRole("switch");
  }
  get freeCardHeading(): Locator {
    return this.page.locator("#pricing h3", { hasText: "Free" });
  }
  get proCardHeading(): Locator {
    return this.page.locator("#pricing h3", { hasText: "Pro" });
  }
  get proCardPrice(): Locator {
    return this.proCardHeading.locator("xpath=..").locator("p.font-heading");
  }

  // Attribution
  get attributionText(): Locator {
    return this.page.getByText(/powered by claude ai/i);
  }

  // Footer
  get footer(): Locator {
    return this.page.locator("footer");
  }
  get footerBrandHeading(): Locator {
    return this.footer.getByText(/plexease/i).first();
  }
  get footerProductHeading(): Locator {
    return this.footer.getByText("Product");
  }
  get footerLegalHeading(): Locator {
    return this.footer.getByText("Legal");
  }
  get footerTermsLink(): Locator {
    return this.footer.getByRole("link", { name: "Terms of Service" });
  }
  get footerPrivacyLink(): Locator {
    return this.footer.getByRole("link", { name: "Privacy Policy" });
  }
  get manageCookiesButton(): Locator {
    return this.footer.getByRole("button", { name: /manage cookies/i });
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }
}
