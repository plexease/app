import type { Page } from "@playwright/test";

export class ErrorPage {
  constructor(private page: Page) {}

  readonly heading404 = this.page.locator("h1", { hasText: "404" });
  readonly message = this.page.getByText("Page not found");
  readonly dashboardLink = this.page.locator('a[href="/dashboard"]');
  readonly homeLink = this.page.locator('a[href="/"]');
}
