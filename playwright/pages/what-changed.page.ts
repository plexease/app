import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class WhatChangedPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /what changed/i });
  }

  get formInput(): Locator {
    return this.changeInput;
  }

  get changeInput(): Locator {
    return this.main.locator("textarea#change-input");
  }

  get setupInput(): Locator {
    return this.main.locator("textarea#setup-input");
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get affectedSection(): Locator {
    return this.main.getByRole("heading", { name: /affected integrations/i }).locator("..");
  }

  get prioritySection(): Locator {
    return this.main.getByRole("heading", { name: /priority order/i }).locator("..");
  }

  get migrationStepsSection(): Locator {
    return this.main.getByRole("heading", { name: /migration steps/i }).locator("..");
  }

  get workaroundsSection(): Locator {
    return this.main.getByRole("heading", { name: /workarounds/i }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/what-changed");
  }

  async analyseChange(change: string) {
    await this.changeInput.fill(change);
    await this.submitButton.click();
  }
}
