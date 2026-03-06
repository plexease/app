import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  readonly emailInput = this.page.locator('input[id="email"]');
  readonly passwordInput = this.page.locator('input[id="password"]');
  readonly submitButton = this.page.locator('button[type="submit"]');
  readonly forgotPasswordLink = this.page.locator('a[href="/forgot-password"]');

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
