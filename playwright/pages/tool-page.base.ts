import type { Page, Locator } from "@playwright/test";

/**
 * Base page object for tool pages. Each tool extends this class.
 *
 * When adding a new tool in Phase 8+:
 * 1. Create a page object extending ToolPageBase
 * 2. Add a smoke test in playwright/tests/fast/
 */
export abstract class ToolPageBase {
  protected readonly main: Locator;

  constructor(protected page: Page) {
    this.main = page.locator("main");
  }

  abstract get heading(): Locator;
  abstract get formInput(): Locator;
  abstract get submitButton(): Locator;

  get usageCounter(): Locator {
    return this.main.getByText(/\d+ of 20 free lookups/);
  }

  get limitReachedMessage(): Locator {
    return this.main.getByText("You've used all 20 free lookups");
  }

  get upgradeButton(): Locator {
    return this.main.locator('a[href="/upgrade"]');
  }

  abstract goto(): Promise<void>;
}
